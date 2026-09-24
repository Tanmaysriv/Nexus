import { analyzeRepository } from "@/lib/repository-analyzer";
import { requireCurrentUser } from "@/lib/auth";
import { getGitHubProfile } from "@/lib/github";
import { generateInterviewQuestions } from "@/lib/interview-engine";
import InterviewCoach from "./interview-coach";

type PageProps = {
  params: Promise<{
    name: string;
  }>;
};

export default async function InterviewPage({
  params,
}: PageProps) {
  const { name } = await params;

  const projectName = decodeURIComponent(name);

  const user = await requireCurrentUser();
  const githubProfile = await getGitHubProfile(user.id);

  const signals = await analyzeRepository(
    user.id,
    githubProfile.login,
    projectName
  );

  const questions =
    generateInterviewQuestions(
      projectName,
      signals
    );

  return (
    <InterviewCoach
      projectName={projectName}
      questions={questions}
    />
  );
}

