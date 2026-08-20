"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { name: "Overview", href: "/dashboard" },
  { name: "GitHub", href: "/github" },
  { name: "Projects", href: "/projects" },
  { name: "Career", href: "/career" },
  { name: "Interview", href: "/interview" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <Link
          href="/dashboard"
          className="text-lg font-bold"
        >
          NEXUS
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border p-2"
          aria-label="Toggle navigation"
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {open && (
        <div className="border-b bg-card p-3">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`
                  rounded-lg px-3 py-3 text-sm
                  ${
                    pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }
                `}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}