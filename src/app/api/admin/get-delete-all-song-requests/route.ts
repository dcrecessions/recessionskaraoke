// src/app/api/admin/song-requests/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request: Request) {
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
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20", 10);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  // Build filters
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { song: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  // Count + query
  const total = await prisma.songRequest.count({ where });
  const data = await prisma.songRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      statusBy: { select: { name: true } }, // if you have that relation
    },
  });

  return NextResponse.json({ data, total });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const ids: string[] = body.ids;

  if (Array.isArray(ids) && ids.length > 0) {
    // delete selected
    await prisma.songRequest.deleteMany({ where: { id: { in: ids } } });
  } else {
    // delete all
    await prisma.songRequest.deleteMany({});
  }

  return NextResponse.json({ success: true });
}
