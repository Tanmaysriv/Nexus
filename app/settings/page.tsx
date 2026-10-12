
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountSettings from "./account-settings";

import {
  Bot,
  CheckCircle2,
  Database,
  GitBranch,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Integration = {
  title: string;
  description: string;
  icon: typeof GitBranch;
  configured: boolean;
};

function statusLabel(configured: boolean) {
  return configured ? "Configured" : "Not Configured";
}

type SettingsPageProps = {
  searchParams: Promise<{
    github?: string;
  }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;

  const githubAccount =
    await prisma.gitHubAccount.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        login: true,
      },
    });

  const githubConfigured = Boolean(githubAccount);

  const integrations: Integration[] = [
    {
      title: "GitHub Intelligence",
      description:
        "NEXUS uses your connected GitHub account to analyze repositories, engineering signals, and project health.",
      icon: GitBranch,
      configured: githubConfigured,
    },
    {
      title: "AI Career Copilot",
      description:
        "Gemini powers career recommendations, interview evaluation, and conversational career assistance.",
      icon: Bot,
      configured: Boolean(process.env.GEMINI_API_KEY),
    },
    {
      title: "Career Intelligence",
      description:
        "Career readiness, job matching, roadmap progress, and action recommendations are generated from your available engineering signals.",
      icon: Sparkles,
      configured:
        githubConfigured &&
        Boolean(process.env.DATABASE_URL),
    },
    {
      title: "Database",
      description:
        "Interview sessions, career roadmap progress, actions, and Copilot conversations are persisted through Prisma and PostgreSQL.",
      icon: Database,
      configured: Boolean(process.env.DATABASE_URL),
    },
  ];

  const configuredCount =
    integrations.filter((integration) => integration.configured)
      .length;

  const allConfigured =
    configuredCount === integrations.length;

  const githubMessages: Record<string, string> = {
    connected:
      "GitHub account connected successfully.",
    "already-connected":
      "Your GitHub account is already connected.",
    "authorization-denied":
      "GitHub authorization was cancelled.",
    "invalid-state":
      "The GitHub authorization session expired or was invalid. Please try again.",
    "invalid-callback":
      "The GitHub authorization callback was incomplete.",
    "account-already-connected":
      "This GitHub account is already connected to another NEXUS account.",
    "different-account-connected":
      "A different GitHub account is already connected to this NEXUS account.",
    "authentication-required":
      "Please sign in before connecting GitHub.",
    "connect-error":
      "Unable to connect GitHub. Please try again.",
  };

  const githubMessage = params.github
    ? githubMessages[params.github]
    : undefined;

  const githubMessageSuccess =
    params.github === "connected";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-white/30">
          System Configuration
        </p>

        <h1 className="text-3xl font-semibold text-white">
          Settings
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-white/50">
          Manage your NEXUS integrations and connected
          developer services.
        </p>
      </div>

      {githubMessage && (
        <div
          className={`mt-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
            githubMessageSuccess
              ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300"
              : "border-red-400/20 bg-red-400/[0.05] text-red-300"
          }`}
        >
          {githubMessageSuccess ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <Info className="h-4 w-4 shrink-0" />
          )}

          <span>{githubMessage}</span>
        </div>
      )}

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <GitBranch className="h-5 w-5 text-white/70" />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  GitHub Account
                </h2>

                <p className="text-sm text-white/40">
                  {githubAccount
                    ? `Connected as @${githubAccount.login}`
                    : "Connect GitHub to activate your engineering intelligence."}
                </p>
              </div>
            </div>
          </div>

          {githubAccount ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Connected
            </div>
          ) : (
            <a
  href="/api/github/connect"
  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
>
  Connect GitHub
</a>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-white/5 bg-black/10 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />

            <p className="text-xs leading-5 text-white/40">
              NEXUS stores your GitHub access token encrypted
              at rest and associates the connected GitHub
              account with your NEXUS user account. Your GitHub
              data is not shared between NEXUS users.
            </p>
          </div>
        </div>
      </section>

      <AccountSettings
        name={user.name}
      email={user.email}
      githubConnected={githubConfigured}
      theme={user.theme === "light" ? "light" : "dark"}
    />

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Integrations
            </h2>

            <p className="mt-1 text-sm text-white/40">
              {configuredCount} of {integrations.length} configured
            </p>
          </div>

          {allConfigured && (
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              All systems ready
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => {
            const Icon = integration.icon;

            return (
              <div
                key={integration.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                    <Icon className="h-5 w-5 text-white/60" />
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] ${
                      integration.configured
                        ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-white/30"
                    }`}
                  >
                    {statusLabel(
                      integration.configured,
                    )}
                  </span>
                </div>

                <h3 className="mt-4 font-medium text-white">
                  {integration.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  {integration.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
