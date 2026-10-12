import { describe, expect, it } from "vitest";
import { createProjectEvidenceDrafts } from "@/lib/project-evidence-drafts";

describe("project evidence drafts", () => {
  it("uses supplied contribution and repository analyzer evidence", () => {
    const drafts = createProjectEvidenceDrafts({
      name: "sample-app",
      description: "A portfolio application",
      contribution: "implemented the dashboard",
      signals: { technologies: ["TypeScript", "React"], hasReadme: true, hasPackageJson: true, hasTests: true, hasDocker: false, hasCI: true, hasTypeScript: true, hasEnvironmentExample: false, hasLicense: false },
    });
    expect(drafts.resumeBullet).toContain("implemented the dashboard");
    expect(drafts.resumeBullet).toContain("TypeScript, React");
    expect(drafts.resumeBullet).toContain("automated tests");
    expect(drafts.resumeBullet).not.toContain("Docker");
    expect(drafts.projectExplanation).toContain("A portfolio application");
    expect(drafts.architectureExplanation).toContain("do not establish runtime components");
  });

  it("does not invent contribution, stack, or project description", () => {
    const drafts = createProjectEvidenceDrafts({
      name: "empty-repo",
      description: null,
      contribution: "",
      signals: { technologies: [], hasReadme: false, hasPackageJson: false, hasTests: false, hasDocker: false, hasCI: false, hasTypeScript: false, hasEnvironmentExample: false, hasLicense: false },
    });
    expect(drafts.resumeBullet).toContain("empty-repo");
    expect(drafts.resumeBullet).toContain("No technology was detected");
    expect(drafts.projectExplanation).toContain("No repository description is available");
    expect(drafts.projectExplanation).toContain("Add your specific contribution");
  });
});
