import { requireCurrentUser } from "@/lib/auth";
import DsaWorkspace from "./workspace";

export default async function DsaPage() {
  await requireCurrentUser();
  return <DsaWorkspace />;
}
