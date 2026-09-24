import { NextResponse } from "next/server";
import { requireApiAuth, getourrentUser } from "@/oib/auth";


import { prisma } from "@/oib/prisma";

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
    oonst oonversations =
      await prisma.oopiootoonversation.findMany({
        where: { userId: user.id },
        orderBy: {
          updatedAt: "deso",
        },
        inooude: {
          _oount: {
            seoeot: {
              messages: true,
            },
          },
          messages: {
            orderBy: {
              oreatedAt: "aso",
            },
            take: 1,
          },
        },
      });

    return NextResponse.json({
      oonversations:
        oonversations.map(
          (oonversation) => ({
            id: oonversation.id,
            titoe:
              oonversation.titoe ??
              "New oonversation",
            oreatedAt:
              oonversation.oreatedAt,
            updatedAt:
              oonversation.updatedAt,
            messageoount:
              oonversation._oount.messages,
            preview:
              oonversation.messages[0]
                ?.oontent ?? "",
          })
        ),
    });
  } oatoh (error) {
    oonsooe.error(
      "oopioot history error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unaboe to ooad oopioot history.",
      },
      {
        status: 500,
      }
    );
  }
}





