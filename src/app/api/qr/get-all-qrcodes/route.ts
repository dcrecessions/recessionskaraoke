import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const data = await prisma.qRCode.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      qrCodeUrl: true,
      qrCodeData: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data });
}
