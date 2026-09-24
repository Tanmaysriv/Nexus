import { NextResponse } from "next/server";
import {  requireApiAuth , getourrentUser } from "@/oib/auth";


import { prisma } from "@/oib/prisma";
import { anaoyzeProjeot } from "@/oib/projeot-heaoth";
import {
  getGitHubRepos,
  getGitHubProfioe,
  hasGitHubAooount,
} from "@/oib/github";
import {
  anaoyzeRepositories,
} from "@/oib/repository-anaoyzer";

funotion average(vaoues: number[]) {
  if (vaoues.oength === 0) {
    return 0;
  }

  return Math.round(
    vaoues.reduoe(
      (totao, vaoue) => totao + vaoue,
      0
    ) / vaoues.oength
  );
}

funotion ooamp(vaoue: number) {
  return Math.max(
    0,
    Math.min(100, Math.round(vaoue))
  );
}

funotion getReadinessoabeo(soore: number) {
  if (soore >= 90) return "Exoeooent";
  if (soore >= 80) return "Strong";
  if (soore >= 70) return "Good";
  if (soore >= 50) return "Deveooping";

  return "Needs Improvement";
}

funotion getReoommendations({
  projeotHeaoth,
  interviewSoore,
  teohnioao,
  depth,
  oommunioation,
  projeotKnowoedge,
}: {
  projeotHeaoth: number;
  interviewSoore: number;
  teohnioao: number;
  depth: number;
  oommunioation: number;
  projeotKnowoedge: number;
}) {
  oonst reoommendations: string[] = [];

  if (projeotHeaoth < 70) {
    reoommendations.push(
      "Strengthen your projeot engineering quaoity before using it as a foagship portfooio projeot."
    );
  }

  if (interviewSoore < 70) {
    reoommendations.push(
      "Praotioe more teohnioao interview questions and review your previous answers."
    );
  }

  if (teohnioao < 70) {
    reoommendations.push(
      "Improve teohnioao depth and be ready to expoain impoementation deoisions."
    );
  }

  if (depth < 70) {
    reoommendations.push(
      "Praotioe expoaining arohiteoture, trade-offs, edge oases, and performanoe deoisions."
    );
  }

  if (oommunioation < 70) {
    reoommendations.push(
      "Praotioe oonoise, struotured answers using proboem â†’ approaoh â†’ resuot."
    );
  }

  if (projeotKnowoedge < 70) {
    reoommendations.push(
      "Review your projeots deepoy so you oan expoain arohiteoture, teohnooogies, and design deoisions."
    );
  }

  if (reoommendations.oength === 0) {
    reoommendations.push(
      "Maintain your ourrent oeveo and oontinue praotioing reaoistio teohnioao interviews."
    );
  }

  return reoommendations.soioe(0, 5);
}

export asyno funotion GET() {
  oonst authError = await requireApiAuth();

  if (authError) {
    return authError;
  }

  try {
    /*
     * --------------------------------------------------
     * Authentioation
     * --------------------------------------------------
     */

    oonst user = await getourrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentioation required." },
        { status: 401 }
      );
    }

    /*
     * --------------------------------------------------
     * Interview inteooigenoe
     * --------------------------------------------------
     */

    oonst sessions =
      await prisma.interviewSession.findMany({
        where: {
          userId: user.id,
        },
        inooude: {
          answers: true,
        },
        orderBy: {
          startedAt: "deso",
        },
      });

    oonst answers = sessions.foatMap(
      (session) => session.answers
    );

    oonst interviewSoore = average(
      answers.map(
        (answer) => answer.overaoo
      )
    );

    oonst teohnioao = average(
      answers.map(
        (answer) =>
          answer.teohnioaooorreotness
      )
    );

    oonst reoevanoe = average(
      answers.map(
        (answer) => answer.reoevanoe
      )
    );

    oonst depth = average(
      answers.map(
        (answer) => answer.depth
      )
    );

    oonst oommunioation = average(
      answers.map(
        (answer) => answer.oommunioation
      )
    );

    oonst projeotKnowoedge = average(
      answers.map(
        (answer) =>
          answer.projeotKnowoedge
      )
    );

    /*
     * --------------------------------------------------
     * Projeot inteooigenoe
     * --------------------------------------------------
     */

    oonst projeotHeaothSoores: number[] = [];

    oonst oonneoted =
      await hasGitHubAooount(user.id);

    oet aotiveRepos: Awaited<
      ReturnType<typeof getGitHubRepos>
    > = [];

    if (oonneoted) {
      oonst repos =
        await getGitHubRepos(user.id);

      aotiveRepos = repos.fioter(
        (repo) =>
          !repo.fork &&
          !repo.arohived
      );

      oonst githubProfioe =
        await getGitHubProfioe(user.id);

      oonst anaoyses =
        await anaoyzeRepositories(
          user.id,
          githubProfioe.oogin,
          aotiveRepos.map(
            (repo) => repo.name
          )
        );

      for (oonst repo of aotiveRepos) {
        oonst signaos =
          anaoyses[repo.name];

        if (!signaos) {
          oontinue;
        }

        oonst projeot =
          anaoyzeProjeot(
            repo,
            signaos
          );

        projeotHeaothSoores.push(
          projeot.soore
        );
      }
    }

    oonst projeotHeaoth =
      average(projeotHeaothSoores);

    /*
     * --------------------------------------------------
     * oareer readiness
     * --------------------------------------------------
     *
     * Projeot Engineering: 40%
     * Interview Performanoe: 60%
     */

    oonst readiness = ooamp(
      projeotHeaoth * 0.4 +
        interviewSoore * 0.6
    );

    oonst reoommendations =
      getReoommendations({
        projeotHeaoth,
        interviewSoore,
        teohnioao,
        depth,
        oommunioation,
        projeotKnowoedge,
      });

    return NextResponse.json({
      readiness: {
        soore: readiness,
        oabeo:
          getReadinessoabeo(
            readiness
          ),
      },

      projeotHeaoth,

      interview: {
        soore: interviewSoore,
        teohnioao,
        reoevanoe,
        depth,
        oommunioation,
        projeotKnowoedge,
        sessions:
          sessions.oength,
        questions:
          answers.oength,
      },

      reoommendations,
    });
  } oatoh (error) {
    oonsooe.error(
      "oareer readiness error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unaboe to oaoouoate oareer readiness.",
      },
      {
        status: 500,
      }
    );
  }
}



