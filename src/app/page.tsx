import { logout } from "@/lib/auth-actions";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        📰 Ma Revue de Presse
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Authentification en place. Le fil d&apos;articles arrive à l&apos;étape suivante.
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
