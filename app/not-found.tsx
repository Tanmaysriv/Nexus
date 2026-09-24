export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">
          404
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>

        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-lg border px-5 py-2 text-sm"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
