import { getCachedRepositoryAnalysis } from "@/lib/github-cache";
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

  const owner =
    process.env.GITHUB_USERNAME || "Tanmaysriv";

  const signals =
    await getCachedRepositoryAnalysis(
      owner,
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