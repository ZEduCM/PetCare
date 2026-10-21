import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const JMETER_VERSION = "5.6.3";
const JMETER_URL = `https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz`;

const root = new URL("..", import.meta.url);
const path = (relative) => fileURLToPath(new URL(relative, root));

const port = process.env.PERFORMANCE_PORT ?? "3300";
const baseUrl = `http://127.0.0.1:${port}`;
const toolsDir = path(".jmeter/");
const jmeterJar = path(`.jmeter/apache-jmeter-${JMETER_VERSION}/bin/ApacheJMeter.jar`);
const resultsDir = path("performance/results/");
const resultsFile = path("performance/results/results.jtl");
const reportDir = path("performance/results/report");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))));
  });
}

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function ensureJMeter() {
  if (existsSync(jmeterJar)) return;

  console.log(`Downloading Apache JMeter ${JMETER_VERSION}...`);
  const archive = await download(JMETER_URL);
  const expected = (await download(`${JMETER_URL}.sha512`)).toString("utf8").trim().split(/\s+/)[0];
  const actual = createHash("sha512").update(archive).digest("hex");
  if (actual !== expected) throw new Error("The JMeter download does not match its SHA-512 checksum.");

  await mkdir(toolsDir, { recursive: true });
  const archivePath = path(`.jmeter/apache-jmeter-${JMETER_VERSION}.tgz`);
  await writeFile(archivePath, archive);
  await run("tar", ["-xzf", archivePath, "-C", toolsDir]);
  await rm(archivePath);
}

async function startServer() {
  const server = spawn(process.execPath, [path("scripts/test-server.mjs")], {
    env: { ...process.env, TEST_SERVER_PORT: port },
    stdio: ["ignore", "ignore", "inherit"],
  });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error("The test server stopped before it was ready.");
    try {
      if ((await fetch(`${baseUrl}/login`)).ok) return server;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  server.kill("SIGTERM");
  throw new Error("The test server did not start within 60 seconds.");
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted && char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function percentile(sorted, value) {
  return sorted[Math.min(sorted.length - 1, Math.ceil((value / 100) * sorted.length) - 1)];
}

async function summarize() {
  const [header, ...lines] = (await readFile(resultsFile, "utf8")).trim().split("\n");
  const columns = parseCsvLine(header);
  const samples = lines.map((line) => Object.fromEntries(parseCsvLine(line).map((value, i) => [columns[i], value])));

  const byLabel = new Map();
  for (const sample of samples) {
    const group = byLabel.get(sample.label) ?? [];
    group.push(sample);
    byLabel.set(sample.label, group);
  }

  const rows = [...byLabel].map(([label, group]) => {
    const elapsed = group.map((sample) => Number(sample.elapsed)).sort((a, b) => a - b);
    const start = Math.min(...group.map((sample) => Number(sample.timeStamp)));
    const end = Math.max(...group.map((sample) => Number(sample.timeStamp) + Number(sample.elapsed)));
    return {
      label,
      samples: group.length,
      failures: group.filter((sample) => sample.success !== "true").length,
      "req/s": Math.round(group.length / Math.max((end - start) / 1000, 0.001)),
      "p50 ms": percentile(elapsed, 50),
      "p95 ms": percentile(elapsed, 95),
      "p99 ms": percentile(elapsed, 99),
      "max ms": elapsed.at(-1),
    };
  });
  console.table(rows);

  const failures = samples.filter((sample) => sample.success !== "true");
  for (const failure of failures.slice(0, 10)) {
    console.error(`FAIL ${failure.label}: ${failure.responseCode} ${failure.failureMessage}`);
  }
  return failures.length;
}

if (!existsSync(path(".next/BUILD_ID"))) {
  console.error("Run `next build` before the performance test.");
  process.exit(1);
}

await ensureJMeter();
await rm(resultsDir, { recursive: true, force: true });
await mkdir(resultsDir, { recursive: true });

const server = await startServer();
let failures = 0;
try {
  await run("java", [
    "-jar",
    jmeterJar,
    "-n",
    "-t",
    path("performance/petcare.jmx"),
    "-l",
    resultsFile,
    "-j",
    path("performance/results/jmeter.log"),
    "-e",
    "-o",
    reportDir,
    "-Jhost=127.0.0.1",
    `-Jport=${port}`,
    `-Jemail=carga.${Date.now()}@petcare.test`,
    "-Jjmeter.save.saveservice.output_format=csv",
  ]);
  failures = await summarize();
} finally {
  server.kill("SIGTERM");
}

console.log(`HTML report: ${reportDir}/index.html`);
if (failures > 0) {
  console.error(`${failures} samples failed their assertions.`);
  process.exit(1);
}
