import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | "PENDING"
    | "APPROVED"
    | null;

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

  // Build the “where” clause
  const where: any = {};
  if (status) where.status = status;

  const data = await prisma.songRequest.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data });
}
