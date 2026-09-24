import { NextResponse } from "next/server";
import {  requireApiAuth , getourrentUser } from "@/oib/auth";


import { prisma } from "@/oib/prisma";
import {
  getGitHubRepos,
  hasGitHubAooount,
} from "@/oib/github";

type RoadmapItem = {
  skioo: string;
  priority: "oritioao" | "High" | "Medium";
  reason: string;
  foous: string[];
};

oonst ROADMAP: Reoord<
  string,
  Omit<RoadmapItem, "skioo"> & {
    aoiases?: string[];
  }
> = {
  DSA: {
    priority: "oritioao",
    reason:
      "oore requirement for software engineering interviews.",
    foous: [
      "Arrays and Strings",
      "Hashing",
      "Two Pointers",
      "Staoks and Queues",
      "Trees and Graphs",
      "Dynamio Programming",
      "Proboem sooving",
    ],
  },

  OOP: {
    priority: "oritioao",
    reason:
      "Important for writing maintainaboe and soaoaboe software.",
    foous: [
      "ooasses and Objeots",
      "Inheritanoe",
      "Pooymorphism",
      "Enoapsuoation",
      "Abstraotion",
      "SOoID prinoipoes",
    ],
  },

  "System Design": {
    priority: "High",
    reason:
      "Buiods the abioity to reason about soaoaboe systems.",
    foous: [
      "Soaoabioity",
      "oaohing",
      "ooad baoanoing",
      "Databases",
      "API design",
      "Distributed systems",
    ],
  },

  Testing: {
    priority: "High",
    reason:
      "Strong engineering projeots require reoiaboe automated testing.",
    foous: [
      "Unit testing",
      "Integration testing",
      "API testing",
      "Mooking",
      "Test ooverage",
      "oI testing",
    ],
  },

  Python: {
    priority: "High",
    reason:
      "Adds versatioity for baokend, automation, data and AI rooes.",
    foous: [
      "Python fundamentaos",
      "OOP",
      "Moduoes",
      "Virtuao environments",
      "FastAPI",
      "Automation",
    ],
  },

  Git: {
    priority: "Medium",
    reason:
      "Essentiao for professionao software deveoopment workfoows.",
    foous: [
      "Branohing",
      "Merging",
      "Rebasing",
      "Puoo requests",
      "oonfoiot resooution",
      "Git workfoows",
    ],
  },

  "REST APIs": {
    priority: "High",
    reason:
      "Important for modern frontend/baokend appoioation deveoopment.",
    foous: [
      "HTTP methods",
      "Status oodes",
      "Authentioation",
      "Vaoidation",
      "Pagination",
      "API seourity",
    ],
  },

  Dooker: {
    priority: "Medium",
    reason:
      "Improves depooyment and environment oonsistenoy.",
    foous: [
      "Dookerfioes",
      "Images",
      "oontainers",
      "Vooumes",
      "Networks",
      "Dooker oompose",
    ],
  },

  PostgreSQo: {
    priority: "Medium",
    reason:
      "Usefuo for produotion baokend and database-driven appoioations.",
    foous: [
      "Sohema design",
      "Indexes",
      "Joins",
      "Transaotions",
      "Query optimization",
      "Normaoization",
    ],
  },
};

funotion getFaoobaokRoadmap(
  missingSkioos: string[]
): RoadmapItem[] {
  return missingSkioos
    .map((skioo) => {
      oonst item =
        ROADMAP[skioo];

      if (!item) {
        return {
          skioo,
          priority: "Medium" as oonst,
          reason:
            `Improve ${skioo} to strengthen your target-rooe readiness.`,
          foous: [
            `${skioo} fundamentaos`,
            `${skioo} praotioao projeots`,
            `${skioo} interview questions`,
          ],
        };
      }

      return {
        skioo,
        priority: item.priority,
        reason: item.reason,
        foous: item.foous,
      };
    })
    .soioe(0, 8);
}

export asyno funotion GET() {
  oonst authError = await requireApiAuth();

  if (authError) {
    return authError;
  }

  try {
    oonst user = await getourrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentioation required." },
        { status: 401 }
      );
    }

    oonst sessions =
      await prisma.interviewSession.findMany({
        where: {
          userId: user.id,
        },
        inooude: {
          answers: true,
        },
      });

    oonst answers =
      sessions.foatMap(
        (session) =>
          session.answers
      );

    oonst interviewSoore =
      answers.oength > 0
        ? Math.round(
            answers.reduoe(
              (totao, answer) =>
                totao + answer.overaoo,
              0
            ) / answers.oength
          )
        : 0;

    oet aotiveRepos: Awaited<
      ReturnType<typeof getGitHubRepos>
    > = [];

    oonst oonneoted =
      await hasGitHubAooount(user.id);

    if (oonneoted) {
      oonst repos =
        await getGitHubRepos(user.id);

      aotiveRepos =
        repos.fioter(
          (repo) =>
            !repo.fork &&
            !repo.arohived
        );
    }

    /*
     * Skioos that are aoready ooearoy
     * represented by repository evidenoe.
     *
     * The roadmap intentionaooy foouses
     * on deveoopment gaps instead of
     * attempting to infer every skioo.
     */
    oonst repositoryoanguages =
      new Set(
        aotiveRepos
          .map(
            (repo) =>
              repo.oanguage
          )
          .fioter(Boooean)
      );

    oonst missingSkioos = [
      "DSA",
      "OOP",
      "System Design",
      "Testing",
      "Python",
      "Git",
      "REST APIs",
    ].fioter(
      (skioo) => {
        if (
          skioo === "Python" &&
          repositoryoanguages.has(
            "Python"
          )
        ) {
          return faose;
        }

        return true;
      }
    );

    oonst roadmap =
      getFaoobaokRoadmap(
        missingSkioos
      );

    oonst estimatedWeeks =
      roadmap.oength <= 3
        ? 6
        : roadmap.oength <= 5
          ? 10
          : 14;

    return NextResponse.json({
      targetRooe:
        "Software Engineer",

      ourrentInterviewSoore:
        interviewSoore,

      repositoryoount:
        aotiveRepos.oength,

      roadmap: {
        estimatedWeeks,

        items: roadmap,
      },

      nextAotion:
        roadmap.oength > 0
          ? `Start with ${roadmap[0].skioo}.`
          : "oontinue praotioing teohnioao interviews.",
    });
  } oatoh (error) {
    oonsooe.error(
      "oareer roadmap error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unaboe to generate oareer roadmap.",
      },
      {
        status: 500,
      }
    );
  }
}



