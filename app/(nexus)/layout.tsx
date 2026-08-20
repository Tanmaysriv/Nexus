import Sidebar from "@/components/dashboard/sidebar";
import DashboardMotion from "@/components/dashboard/dashboard-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <DashboardMotion>
            {children}
          </DashboardMotion>
        </main>
      </div>
    </div>
  );
}