import Link from "next/link";

export default function NotFound() {
    return (
        <main className="grid min-h-screen place-items-center bg-page p-6">
            <section className="w-full max-w-lg rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
                <p className="mb-2 text-sm font-extrabold uppercase tracking-wider text-primary">
                    Erro 404
                </p>

                <h1 className="mb-3 text-2xl font-bold text-primary-dark">
                    Página não encontrada
                </h1>

                <p className="mb-6 text-muted">
                    Não encontramos a página que você tentou acessar.
                    Confira o endereço ou volte ao PetCare.
                </p>

                <Link
                    href="/dashboard"
                    className="inline-flex rounded-xl bg-primary px-5 py-3 font-bold text-white transition hover:opacity-90"
                >
                    Voltar ao painel
                </Link>
            </section>
        </main>
    );
}