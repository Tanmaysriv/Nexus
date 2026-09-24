"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "GitHub",
    href: "/github",
    icon: GitBranch,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Career",
    href: "/career",
    icon: BriefcaseBusiness,
  },
  {
    name: "Interview",
    href: "/interview",
    icon: UserRoundSearch,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
const router = useRouter();

  async function handleLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } finally {
    router.replace("/login");
    router.refresh();
  }
}

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <div className="sticky top-0 flex h-screen flex-col p-5">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>

            <span className="text-xl font-bold tracking-tight">
              NEXUS
            </span>
          </Link>

          {/* Navigation */}
          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5
                    text-sm font-medium transition-colors
                    ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings + Logout */}
          <div className="space-y-1">
            <Link
              href="/settings"
              className={`
                flex items-center gap-3 rounded-xl px-3 py-2.5
                text-sm font-medium transition-colors
                ${
                  pathname === "/settings"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <nav className="sticky top-0 z-40 flex w-full overflow-x-auto border-b bg-card/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="flex min-w-max gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 rounded-lg px-3 py-2
                  whitespace-nowrap text-xs font-medium transition-colors
                  ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          <Link
            href="/settings"
            className={`
              flex items-center gap-2 rounded-lg px-3 py-2
              whitespace-nowrap text-xs font-medium transition-colors
              ${
                pathname === "/settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
