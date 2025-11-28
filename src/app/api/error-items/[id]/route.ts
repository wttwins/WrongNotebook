import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const errorItem = await prisma.errorItem.findUnique({
            where: {
                id: params.id,
            },
            include: {
                subject: true,
            },
        });

        if (!errorItem) {
            return NextResponse.json({ message: "Item not found" }, { status: 404 });
        }

        // Ensure the user owns this item
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (errorItem.userId !== user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json(errorItem);
    } catch (error) {
        console.error("Error fetching item:", error);
        return NextResponse.json(
            { message: "Failed to fetch error item" },
            { status: 500 }
        );
    }
}
