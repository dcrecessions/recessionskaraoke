import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Method guard
  if (request.method !== "PATCH") {
    return NextResponse.json(
      { error: "Method not allowed. Only PATCH" },
      { status: 405 }
    );
  }

  const { id } = await params;
  const body = await request.json();
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
    const { status } = body as {
      status: "PENDING" | "APPROVED" | "SKIPPED" | "REMOVED" | "PLAYED";
    };

    // Update the status (and timestamp)
    const updated = await prisma.songRequest.update({
      where: { id },
      data: {
        status,
        statusChanged: new Date(),
        statusById: session.user.id, // record which admin made this change
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    // P2025 = Prisma error code for record not found
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
}
