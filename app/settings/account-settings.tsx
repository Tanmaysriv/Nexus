"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Session = { id: string; createdAt: string; expiresAt: string };

export default function AccountSettings({
  name,
  email,
  githubConnected,
  theme,
}: {
  name: string | null;
  email: string;
  githubConnected: boolean;
  theme: "dark" | "light";
}) {
  const router = useRouter();
  const [profileName, setProfileName] = useState(name ?? "");
  const [profileEmail, setProfileEmail] = useState(email);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(theme);

  async function send(path: string, method: string, body?: unknown) {
    const response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Request failed.");
    return result;
  }

  useEffect(() => {
    let active = true;
    fetch("/api/user/sessions")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error("Unable to load active sessions.");
        if (active) setSessions(result.sessions);
      })
      .catch(() => {
        if (active) setError("Unable to load active sessions.");
      });
    return () => { active = false; };
  }, []);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      await send("/api/user/profile", "PATCH", { name: profileName, email: profileEmail });
      setMessage("Profile updated.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update profile.");
    } finally { setBusy(false); }
  }

  async function updateTheme(nextTheme: "dark" | "light") {
    setBusy(true); setError(""); setMessage("");
    try {
      await send("/api/user/preferences", "PATCH", { theme: nextTheme });
      setSelectedTheme(nextTheme);
      setMessage("Theme preference saved.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save theme preference.");
    } finally { setBusy(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(""); setMessage("");
    try {
      await send("/api/user/password", "POST", {
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      });
      router.push("/login?password=changed");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to change password.");
    } finally { setBusy(false); }
  }

  async function logoutAll() {
    setBusy(true); setError("");
    try {
      await send("/api/user/sessions", "DELETE");
      router.push("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign out all sessions.");
    } finally { setBusy(false); }
  }

  async function logoutCurrent() {
    setBusy(true); setError("");
    try {
      await send("/api/auth/logout", "POST");
      router.push("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign out.");
    } finally { setBusy(false); }
  }

  async function disconnectGitHub() {
    if (!window.confirm("Disconnect your GitHub account from NEXUS?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await send("/api/github/disconnect", "POST");
      setMessage("GitHub disconnected.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to disconnect GitHub.");
    } finally { setBusy(false); }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("Permanently delete your account and its NEXUS data? This cannot be undone.")) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await send("/api/user/account", "DELETE", { password: form.get("deletePassword") });
      router.push("/register?account=deleted");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete account.");
    } finally { setBusy(false); }
  }

  const inputClass = "mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white";
  const buttonClass = "rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50";

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-white">Profile</h2>
        <form onSubmit={updateProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-white/60">Name<input className={inputClass} value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={100} required /></label>
          <label className="text-sm text-white/60">Email<input className={inputClass} type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} maxLength={320} required /></label>
          <button className={buttonClass} disabled={busy}>Save profile</button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-white">Preferences</h2>
        <label className="mt-3 block max-w-xs text-sm text-white/60">Theme
          <select className={inputClass} value={selectedTheme} onChange={(event) => updateTheme(event.target.value as "dark" | "light")} disabled={busy}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-white">Security</h2>
        <form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-white/60">Current password<input className={inputClass} type="password" name="currentPassword" autoComplete="current-password" required /></label>
          <label className="text-sm text-white/60">New password<input className={inputClass} type="password" name="newPassword" minLength={8} maxLength={256} autoComplete="new-password" required /></label>
          <button className={buttonClass} disabled={busy}>Change password</button>
        </form>
        <div className="mt-6 border-t border-white/10 pt-5">
          <h3 className="text-sm font-medium text-white">Active sessions ({sessions.length})</h3>
          <ul className="mt-2 space-y-2 text-xs text-white/50">
            {sessions.map((session) => <li key={session.id}>Signed in {new Date(session.createdAt).toLocaleString()} · expires {new Date(session.expiresAt).toLocaleDateString()}</li>)}
            {sessions.length === 0 && <li>No active sessions found.</li>}
          </ul>
          <button className={`${buttonClass} mt-4`} onClick={logoutCurrent} disabled={busy}>Sign out this session</button>
          <button className={`${buttonClass} mt-4`} onClick={logoutAll} disabled={busy || sessions.length === 0}>Sign out all sessions</button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-white">Connected accounts</h2>
        <p className="mt-2 text-sm text-white/50">GitHub: {githubConnected ? "Connected" : "Not connected"}</p>
        {githubConnected && <button className={`${buttonClass} mt-4`} onClick={disconnectGitHub} disabled={busy}>Disconnect GitHub</button>}
        {!githubConnected && <a href="/api/github/connect" className={`${buttonClass} mt-4 inline-block`}>Connect GitHub</a>}
      </section>

      <section className="rounded-3xl border border-red-400/20 bg-red-400/[0.03] p-6">
        <h2 className="font-semibold text-red-200">Delete account</h2>
        <p className="mt-2 text-sm text-white/50">This permanently deletes your NEXUS account and related data.</p>
        <form onSubmit={deleteAccount} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input className={`${inputClass} mt-0 sm:max-w-sm`} type="password" name="deletePassword" placeholder="Confirm with your password" autoComplete="current-password" required />
          <button className="rounded-xl border border-red-400/30 px-4 py-2.5 text-sm text-red-200 disabled:opacity-50" disabled={busy}>Delete account</button>
        </form>
      </section>

      <div role="status" aria-live="polite" className="text-sm text-emerald-300">{message}</div>
      {error && <div role="alert" className="text-sm text-red-300">{error}</div>}
    </div>
  );
}
