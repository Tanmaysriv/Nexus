import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import Sidebar from "@/components/dashboard/sidebar";
import DashboardMotion from "@/components/dashboard/dashboard-motion";
import { isAuthenticated } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const theme = (await cookies()).get("nexus_theme")?.value;

  return (
    <div className={`${theme === "dark" ? "dark" : "light-theme"} min-h-screen bg-background text-foreground`}>
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <DashboardMotion>{children}</DashboardMotion>
        </main>
      </div>
    </div>
  );
}
