import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    try {
        const body = await req.json();
        const {
            questionText,
            answerText,
            analysis,
            knowledgePoints,
            originalImageUrl, // We'll need to handle image storage properly later, for now assuming URL or base64
        } = body;

        let user;
        if (session?.user?.email) {
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
            });
        }

        if (!user) {
            console.log("[API] No session or user found, attempting fallback to first user.");
            user = await prisma.user.findFirst();
        }

        if (!user) {
            return NextResponse.json({ message: "Unauthorized - No user found in DB" }, { status: 401 });
        }

        const errorItemData = {
            userId: user.id,
            questionText: questionText || "",
            answerText: answerText || "",
            analysis: analysis || "",
            knowledgePoints: JSON.stringify(knowledgePoints || []),
            originalImageUrl: originalImageUrl || "",
            masteryLevel: 0,
        };

        console.log("[API] Creating ErrorItem with data:", {
            ...errorItemData,
            originalImageUrl: errorItemData.originalImageUrl.substring(0, 50) + "..." // Truncate for log
        });

        const errorItem = await prisma.errorItem.create({
            data: errorItemData,
        });

        return NextResponse.json(errorItem, { status: 201 });
    } catch (error) {
        console.error("Error saving item:", error);
        return NextResponse.json(
            { message: "Failed to save error item" },
            { status: 500 }
        );
    }
}
