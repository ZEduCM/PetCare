export interface StoredCookie {
  value: string;
  options?: Record<string, unknown>;
}

export class CookieJar {
  readonly cookies = new Map<string, StoredCookie>();

  get(name: string) {
    const cookie = this.cookies.get(name);
    return cookie && { name, value: cookie.value };
  }

  set(name: string, value: string, options?: Record<string, unknown>) {
    this.cookies.set(name, { value, options });
  }

  delete(name: string) {
    this.cookies.delete(name);
  }
}

let activeJar = new CookieJar();

export function activateCookieJar(jar: CookieJar) {
  activeJar = jar;
}

export function currentCookieJar() {
  return activeJar;
}
