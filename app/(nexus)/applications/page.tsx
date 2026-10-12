import { requireCurrentUser } from "@/lib/auth";
import ApplicationWorkspace from "./workspace";

export default async function ApplicationsPage() {
  await requireCurrentUser();
  return <ApplicationWorkspace />;
}
