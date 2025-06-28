// src/app/api/admin/song-requests/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function DELETE(request: Request) {
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
  // attempt to parse a JSON body with { ids: string[] }
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? (body.ids as string[]) : [];

  if (ids.length) {
    // delete only the selected
    await prisma.songRequest.deleteMany({
      where: { id: { in: ids } },
    });
  } else {
    // delete every record
    await prisma.songRequest.deleteMany({});
  }

  return NextResponse.json({ success: true });
}
