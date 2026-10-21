export interface Pet {
  id: string;
  name: string;
  type: string;
  age: string;
  weight: string;
  breed: string;
  vaccine: string;
  icon: string;
  description: string;
}

export type PetInput = Omit<Pet, "id">;
