"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              NEXUS is temporarily unavailable
            </h1>

            <p className="mt-3 text-sm">
              Please refresh the page and try again.
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg border px-5 py-2 text-sm"
            >
              Refresh
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
