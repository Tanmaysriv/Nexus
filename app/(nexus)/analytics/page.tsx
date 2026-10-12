import { requireCurrentUser } from "@/lib/auth";
import AnalyticsWorkspace from "./workspace";

export default async function AnalyticsPage() {
  await requireCurrentUser();
  return <AnalyticsWorkspace />;
}
