import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = "force-dynamic"; // Forces the route to be dynamic and prevents caching

export async function GET(req: NextRequest) {
  try {
    // Get session to get the userId of the logged-in user
    const session = await getServerSession(authOptions);

    // If the session does not exist or the user is not logged in
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the userId from the session to filter QR codes
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        userId: session.user.id, // Filter based on the logged-in userId
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(qrCodes);
  } catch (error: any) {
    console.error("Error fetching QR codes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
