export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserWithPassword extends User {
  password: string;
}
