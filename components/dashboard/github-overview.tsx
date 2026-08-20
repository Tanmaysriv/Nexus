import {
  GitBranch,
  GitFork,
  Star,
  Users,
  ExternalLink,
} from "lucide-react";

type GitHubOverviewProps = {
  data: {
    repositoryCount: number;
    totalStars: number;
    totalForks: number;
    profile: {
      followers: number;
      following: number;
    };
    recentRepos: {
      id: number;
      name: string;
      html_url: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
    }[];
  };
};

export default function GitHubOverview({
  data,
}: GitHubOverviewProps) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">GitHub Intelligence</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Live repository information
          </p>
        </div>

        <GitBranch className="h-5 w-5 text-primary" />
      </div>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          icon={GitBranch}
          label="Repositories"
          value={data.repositoryCount}
        />

        <Metric
          icon={Star}
          label="Stars"
          value={data.totalStars}
        />

        <Metric
          icon={GitFork}
          label="Forks"
          value={data.totalForks}
        />

        <Metric
          icon={Users}
          label="Followers"
          value={data.profile.followers}
        />
      </div>

      {/* Recent repositories */}
      <div className="mt-8">
        <h3 className="text-sm font-medium">
          Recently updated
        </h3>

        <div className="mt-3 space-y-2">
          {data.recentRepos.map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group flex items-center justify-between
                rounded-xl border border-border/50
                bg-background/40
                p-3
                transition-all duration-200
                hover:border-primary/30
                hover:bg-muted/50
              "
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {repo.name}
                </p>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {repo.description || "No description"}
                </p>
              </div>

              <div className="ml-4 flex shrink-0 items-center gap-3">
                {repo.language && (
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {repo.language}
                  </span>
                )}

                <Star className="h-3.5 w-3.5 text-muted-foreground" />

                <span className="text-xs text-muted-foreground">
                  {repo.stargazers_count}
                </span>

                <ExternalLink className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4">
      <Icon className="h-4 w-4 text-primary" />

      <p className="mt-3 text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  );
}