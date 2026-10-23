"use client";

import { PawPrint } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  eyebrow,
  fieldError,
  fieldInput,
  fieldLabel,
  primaryButton,
} from "@/components/ui";
import Spinner from "@/components/Spinner";
import { api, errorMessage } from "@/services/api";

export default function Cadastro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Preencha todos os campos.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const result = await api.register(
        name.trim(),
        email.trim().toLowerCase(),
        password,
      );

      setSuccess(result.message);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#eef7f3,#f7faf9_50%)] p-[25px]">
      <section
        className="w-[min(440px,100%)] rounded-[23px] border border-line bg-white px-5 py-[27px] shadow-[0_15px_50px_rgba(47,75,65,.08)] xs:p-[38px]"
        aria-labelledby="register-title"
      >
        <div className="mx-auto mb-5 grid size-20 place-items-center rounded-3xl bg-primary-light text-primary-dark">
          <PawPrint size={50} aria-hidden="true" />
        </div>

        <p className={`${eyebrow} text-center`}>
          CUIDAR FICOU MAIS FÁCIL
        </p>

        <h1
          id="register-title"
          className="text-center text-[1.9rem]"
        >
          Criar conta
        </h1>

        <p className="mb-7 text-center leading-normal text-muted">
          Cadastre-se para cuidar melhor dos seus pets.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label className={fieldLabel} htmlFor="name">
            Nome completo
          </label>
          <input
            className={fieldInput}
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Digite seu nome"
          />

          <label className={fieldLabel} htmlFor="email">
            E-mail
          </label>
          <input
            className={fieldInput}
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Digite seu e-mail"
          />

          <label className={fieldLabel} htmlFor="password">
            Senha
          </label>
          <input
            className={fieldInput}
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
          />

          <label className={fieldLabel} htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <input
            className={fieldInput}
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Digite a senha novamente"
          />

          {error && (
            <p className={`${fieldError} mb-4`} role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="mb-4 text-sm text-green-700" role="status">
              {success}{" "}
              <Link className="font-semibold underline" href="/login">
                Ir para o login
              </Link>
            </p>
          )}

          <button
            className={`${primaryButton} mt-2.5 w-full`}
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading && <Spinner />}
            Criar conta
          </button>
        </form>

        <p className="mt-[18px] text-center text-sm text-muted">
          Já possui uma conta?{" "}
          <Link className="font-semibold underline" href="/login">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}