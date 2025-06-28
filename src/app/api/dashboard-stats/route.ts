// src/app/api/admin/dashboard-stats/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request: Request) {
  // only GET allowed
  if (request.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  // auth check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  // calculate “3am yesterday” window
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 1);
  windowStart.setHours(3, 0, 0, 0);

  // parallel counts
  const [queueCount, pendingCount, playedCount, discardedCount] =
    await Promise.all([
      // APPROVED created since window start
      prisma.songRequest.count({
        where: {
          status: "APPROVED",
          createdAt: { gte: windowStart },
        },
      }),
      // PENDING created since window start
      prisma.songRequest.count({
        where: {
          status: "PENDING",
          createdAt: { gte: windowStart },
        },
      }),
      // PLAYED whose statusChanged since window start
      prisma.songRequest.count({
        where: {
          status: "PLAYED",
          statusChanged: { gte: windowStart },
        },
      }),
      // SKIPPED or REMOVED whose statusChanged since window start
      prisma.songRequest.count({
        where: {
          status: { in: ["SKIPPED", "REMOVED"] },
          statusChanged: { gte: windowStart },
        },
      }),
    ]);

  return NextResponse.json({
    data: { queueCount, pendingCount, playedCount, discardedCount },
  });
}
