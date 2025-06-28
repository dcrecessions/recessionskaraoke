// src/app/api/qr/generate-qr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // disable caching

export async function POST(request: NextRequest) {
  // only allow POST
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Only POST allowed" }, { status: 405 });
  }

  // auth check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  // parse body
  let body: {
    qrId?: string;
    qrCodeData?: string;
    reqStatus?: "NEW" | "UPDATED";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { qrId, qrCodeData, reqStatus } = body;
  if (!qrCodeData || !reqStatus) {
    return NextResponse.json(
      { error: "`qrCodeData` and `reqStatus` are required" },
      { status: 400 }
    );
  }

  // create a safe filename
  const safe = qrCodeData
    .slice(0, 20)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const filename = `${Date.now()}-${safe}.png`;
  const publicDir = path.join(process.cwd(), "public", "qrCodes");
  await fs.promises.mkdir(publicDir, { recursive: true });
  const filePath = path.join(publicDir, filename);

  // generate PNG buffer
  const buffer = await QRCode.toBuffer(qrCodeData, { type: "png", width: 300 });
  await fs.promises.writeFile(filePath, buffer);

  // create or update in DB
  let record;
  if (qrId) {
    record = await prisma.qRCode.update({
      where: { id: qrId },
      data: {
        qrCodeUrl: `/qrCodes/${filename}`,
        qrCodeData,
        status: reqStatus,
      },
    });
  } else {
    record = await prisma.qRCode.create({
      data: {
        userId: session.user.id,
        qrCodeData,
        status: reqStatus,
        qrCodeUrl: `/qrCodes/${filename}`,
      },
    });
  }

  return NextResponse.json({ data: record });
}
