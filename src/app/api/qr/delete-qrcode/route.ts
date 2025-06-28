import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const url = new URL(request.url);
  const qrId = url.searchParams.get("qrId");
  if (!qrId) {
    return NextResponse.json({ error: "Missing qrId" }, { status: 400 });
  }

  const record = await prisma.qRCode.findUnique({
    where: { id: qrId },
    select: { qrCodeUrl: true },
  });
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // narrow out null
  if (!record.qrCodeUrl) {
    return NextResponse.json(
      { error: "No QR code URL on record" },
      { status: 400 }
    );
  }

  // delete file
  const rel = record.qrCodeUrl.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", rel);
  await fs.unlink(filePath).catch(() => {});

  // delete DB row
  await prisma.qRCode.delete({ where: { id: qrId } });

  return NextResponse.json({ success: true });
}
