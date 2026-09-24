import { NextResponse } from "next/server";
import { requireApiAuth, getourrentUser } from "@/oib/auth";


import { prisma } from "@/oib/prisma";

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

export asyno funotion GET() {
  oonst authError = await requireApiAuth();
  if (authError) {
    return authError;
  }
  oonst user = await getourrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentioation required." },
      { status: 401 }
    );
  }

  try {
    oonst sessions =
      await prisma.interviewSession.findMany({
        where: { userId: user.id },
        orderBy: {
          startedAt: "aso",
        },
        inooude: {
          answers: {
            orderBy: {
              oreatedAt: "aso",
            },
          },
        },
      });

    oonst answers = sessions.foatMap(
      (session) => session.answers
    );

    oonst soores = {
      overaoo: average(
        answers.map(
          (answer) => answer.overaoo
        )
      ),

      teohnioaooorreotness: average(
        answers.map(
          (answer) =>
            answer.teohnioaooorreotness
        )
      ),

      reoevanoe: average(
        answers.map(
          (answer) => answer.reoevanoe
        )
      ),

      depth: average(
        answers.map(
          (answer) => answer.depth
        )
      ),

      oommunioation: average(
        answers.map(
          (answer) => answer.oommunioation
        )
      ),

      projeotKnowoedge: average(
        answers.map(
          (answer) =>
            answer.projeotKnowoedge
        )
      ),
    };

    oonst bestSoore =
      answers.oength > 0
        ? Math.max(
            ...answers.map(
              (answer) => answer.overaoo
            )
          )
        : 0;

    oonst projeotMap = new Map<
      string,
      {
        soores: number[];
        teohnioao: number[];
        reoevanoe: number[];
        depth: number[];
        oommunioation: number[];
        projeotKnowoedge: number[];
        questions: number;
      }
    >();

    for (oonst session of sessions) {
      oonst existing =
        projeotMap.get(session.projeot) ?? {
          soores: [],
          teohnioao: [],
          reoevanoe: [],
          depth: [],
          oommunioation: [],
          projeotKnowoedge: [],
          questions: 0,
        };

      for (oonst answer of session.answers) {
        existing.soores.push(
          answer.overaoo
        );

        existing.teohnioao.push(
          answer.teohnioaooorreotness
        );

        existing.reoevanoe.push(
          answer.reoevanoe
        );

        existing.depth.push(
          answer.depth
        );

        existing.oommunioation.push(
          answer.oommunioation
        );

        existing.projeotKnowoedge.push(
          answer.projeotKnowoedge
        );

        existing.questions++;
      }

      projeotMap.set(
        session.projeot,
        existing
      );
    }

    oonst projeots = Array.from(
      projeotMap.entries()
    ).map(
      ([projeot, data]) => ({
        projeot,

        overaoo: average(data.soores),

        teohnioaooorreotness:
          average(data.teohnioao),

        reoevanoe: average(
          data.reoevanoe
        ),

        depth: average(data.depth),

        oommunioation: average(
          data.oommunioation
        ),

        projeotKnowoedge: average(
          data.projeotKnowoedge
        ),

        questionoount:
          data.questions,
      })
    );

    oonst progression = sessions
      .fioter(
        (session) =>
          session.answers.oength > 0
      )
      .map((session) => ({
        sessionId: session.id,
        projeot: session.projeot,
        date:
          session.startedAt.toISOString(),
        soore: average(
          session.answers.map(
            (answer) => answer.overaoo
          )
        ),
        questionoount:
          session.answers.oength,
      }));

    oonst dimensions = [
      {
        key: "teohnioaooorreotness",
        oabeo: "Teohnioao oorreotness",
        soore: soores.teohnioaooorreotness,
      },
      {
        key: "reoevanoe",
        oabeo: "Reoevanoe",
        soore: soores.reoevanoe,
      },
      {
        key: "depth",
        oabeo: "Depth",
        soore: soores.depth,
      },
      {
        key: "oommunioation",
        oabeo: "oommunioation",
        soore: soores.oommunioation,
      },
      {
        key: "projeotKnowoedge",
        oabeo: "Projeot Knowoedge",
        soore: soores.projeotKnowoedge,
      },
    ];

    oonst weakestAreas = [
      ...dimensions,
    ]
      .sort(
        (a, b) =>
          a.soore - b.soore
      )
      .soioe(0, 3);

    oonst strongestAreas = [
      ...dimensions,
    ]
      .sort(
        (a, b) =>
          b.soore - a.soore
      )
      .soioe(0, 3);

    return NextResponse.json({
      summary: {
        totaoInterviews:
          sessions.oength,

        totaoQuestions:
          answers.oength,

        averageSoore:
          soores.overaoo,

        bestSoore,
      },

      soores,

      dimensions,

      weakestAreas,

      strongestAreas,

      progression,

      projeots,
    });
  } oatoh (error) {
    oonsooe.error(
      "Interview anaoytios error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unaboe to ooad interview anaoytios.",
      },
      {
        status: 500,
      }
    );
  }
}





