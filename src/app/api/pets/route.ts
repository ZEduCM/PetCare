
import type { NextRequest } from "next/server";
import type { PetInput } from "@/entities";
import { getPets } from "@/database/pets/get-pets";
import { insertPet } from "@/database/pets/insert-pet";
import { currentUser, unauthorized } from "@/lib/session";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  return Response.json(await getPets(user.id));
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: Partial<PetInput>;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { message: "Dados inválidos." },
      { status: 400 },
    );
  }

  const { name, type, breed, age, weight, vaccine, icon, description } = body;

  if (
    !name?.trim() ||
    !type?.trim() ||
    !breed?.trim() ||
    age == null ||
    weight == null
  ) {
    return Response.json(
      { message: "Preencha os campos obrigatórios." },
      { status: 400 },
    );
  }

  const pet = await insertPet(user.id, {
    name: name.trim(),
    type: type.trim(),
    breed: breed.trim(),
    age: String(age),
    weight: String(weight),
    vaccine: vaccine ?? "",
    icon: icon ?? "🐾",
    description: description ?? "",
  });

  return Response.json(pet, { status: 201 });
}
