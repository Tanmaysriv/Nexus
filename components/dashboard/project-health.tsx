import {
  Activity,
  BookOpen,
  Code2,
  Wrench,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import type { ProjectHealth } from "@/lib/project-health";

type Props = {
  projects: ProjectHealth[];
};

export default function ProjectHealthCard({ projects }: Props) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Project Health</h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            NEXUS analysis of your GitHub projects
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {projects.map((project) => (
          <Link
            key={project.name}
            href={`/projects/${encodeURIComponent(project.name)}`}
            className="block"
          >
            <div
              className="
                rounded-xl border border-border/50
                bg-background/40 p-5
                transition-all duration-200
                hover:-translate-y-1
                hover:border-primary/40
                hover:bg-background/70
                hover:shadow-lg
              "
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.verdict}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {project.score}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    /100
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <HealthMetric
                  icon={Activity}
                  label="Activity"
                  value={project.activity}
                />

                <HealthMetric
                  icon={BookOpen}
                  label="Documentation"
                  value={project.documentation}
                />

                <HealthMetric
                  icon={Wrench}
                  label="Maintenance"
                  value={project.maintenance}
                />

                <HealthMetric
                  icon={Code2}
                  label="Tech Stack"
                  value={project.techStack}
                />
              </div>

              {project.recommendations.length > 0 && (
                <div className="mt-5 border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    NEXUS Recommendations
                  </p>

                  <ul className="mt-2 space-y-1">
                    {project.recommendations.map((recommendation) => (
                      <li
                        key={recommendation}
                        className="text-sm text-muted-foreground"
                      >
                        • {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HealthMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border/40 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />

        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${value}%` }}
          />
        </div>

        <span className="text-xs font-medium">{value}</span>
      </div>
    </div>
  );
}