
import { messages } from "@/messages";

type MessageKey = keyof typeof messages;

const portuguese: Record<MessageKey, string> = {
  requiredFields: "Preencha todos os campos obrigatórios.",
  invalidEmail: "Informe um e-mail válido.",
  shortPassword: "A senha deve ter pelo menos 8 caracteres.",
  invalidAge: "A idade deve ser um número inteiro de 0 a 100.",
  invalidDate: "Informe uma data válida.",
  invalidTime: "Informe um horário válido.",
  invalidVaccineDate: "Informe uma data de vacina válida.",
  invalidId: "Informe um id válido.",
  invalidBody: "Dados inválidos.",
  missingCredentials: "Informe e-mail e senha para continuar.",
  invalidCredentials: "E-mail ou senha inválidos.",
  emailTaken: "Este e-mail já está cadastrado.",
  loginRequired: "Faça login para continuar.",
  petNotFound: "Pet não encontrado.",
  appointmentNotFound: "Compromisso não encontrado.",
  userRegistered: "Usuário cadastrado com sucesso!",
  unexpectedError: "Não foi possível concluir a operação.",
  shortTitle: "Use pelo menos 3 caracteres.",
  invalidCategory: "Selecione uma categoria válida.",
  invalidWeight: "O peso deve ser um número de 0,1 a 1000.",
  invalidPetNameOrBreed: "Nome e raça devem ter no máximo 100 caracteres.",
  invalidPetType: "Selecione um tipo de pet válido.",
};

const byEnglishMessage = new Map<string, string>(
  (Object.keys(messages) as MessageKey[]).map((key) => [
    messages[key],
    portuguese[key],
  ]),
);

export function translate(message: string) {
  return byEnglishMessage.get(message) ?? message;
}
