import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Forces the route to be dynamic and prevents caching

export async function GET(request: NextRequest) {
  // Fetch session using the correct method
  const session = await getServerSession(authOptions); // Use getServerSession without req

  // Check if the user is authenticated and has an admin role
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      {
        error: "Access denied. Admins only.",
      },
      { status: 403 }
    );
  }

  try {
    const requests = await prisma.qRCode.findMany({
      where: { status: "PENDING" },
    });
    return NextResponse.json({
      message: "Pending QR codes found",
      data: requests,
    });
  } catch (error: any) {
    console.error("Error fetching QR requests:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
