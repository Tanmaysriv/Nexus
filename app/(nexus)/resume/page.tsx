import { requireCurrentUser } from "@/lib/auth";
import ResumeWorkspace from "./resume-workspace";

export default async function ResumePage() {
  await requireCurrentUser();
  return <ResumeWorkspace />;
}
