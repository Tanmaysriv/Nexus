import { requireCurrentUser } from "@/lib/auth";
import LearningWorkspace from "./workspace";

export default async function LearningPage() {
  await requireCurrentUser();
  return <LearningWorkspace />;
}
