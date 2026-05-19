import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <span className="font-heading text-6xl">🤔</span>
      <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
        Aquí no hay nada.
      </h1>
      <p className="mt-2 text-muted-foreground">
        Esta página no existe o se movió. Regresa a la quiniela.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
