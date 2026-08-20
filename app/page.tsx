import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          NEXUS
        </h1>

        <p className="mt-4 text-muted-foreground">
          Developer Intelligence Platform
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-transform hover:scale-105"
        >
          Enter NEXUS
        </Link>
      </div>
    </main>
  );
}