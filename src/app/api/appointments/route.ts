import type { NextRequest } from "next/server";
import type { AppointmentInput } from "@/entities";
import { deleteAppointment } from "@/database/appointments/delete-appointment";
import { getAppointments } from "@/database/appointments/get-appointments";
import { insertAppointment } from "@/database/appointments/insert-appointment";
import { updateAppointment } from "@/database/appointments/update-appointment";
import { currentUser, unauthorized } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

async function readBody(
  request: NextRequest,
): Promise<Partial<AppointmentInput>> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function getId(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  return isUuid(id) ? id : null;
}

function petNotFound() {
  return Response.json({ message: "Pet não encontrado." }, { status: 404 });
}

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  return Response.json(await getAppointments(user.id));
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const body = await readBody(request);
  const { petId, title, category, date, time } = body;
  if (!title || !petId || !category || !date || !time) {
    return Response.json(
      { message: "Preencha todos os campos obrigatórios." },
      { status: 400 },
    );
  }
  if (!isUuid(petId)) return petNotFound();

  const item = await insertAppointment(user.id, {
    petId,
    title,
    category,
    date,
    time,
    notes: body.notes ?? "",
  });
  if (!item) return petNotFound();
  return Response.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const id = getId(request);
  if (!id)
    return Response.json({ message: "Informe um id válido." }, { status: 400 });

  const body = await readBody(request);
  if (body.petId !== undefined && !isUuid(body.petId)) return petNotFound();

  const item = await updateAppointment(id, user.id, body);
  if (!item)
    return Response.json(
      { message: "Compromisso não encontrado." },
      { status: 404 },
    );
  return Response.json(item);
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const id = getId(request);
  if (!id)
    return Response.json({ message: "Informe um id válido." }, { status: 400 });

  if (!(await deleteAppointment(id, user.id)))
    return Response.json(
      { message: "Compromisso não encontrado." },
      { status: 404 },
    );
  return new Response(null, { status: 204 });
}
