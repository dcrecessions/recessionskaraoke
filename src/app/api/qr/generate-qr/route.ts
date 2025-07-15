// src/app/api/qr/generate-qr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { v2 as cloudinary } from "cloudinary";

// Use the CLOUDINARY_URL env var or individual vars:
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

  // generate a safe public_id
  const safe = qrCodeData
    .slice(0, 20)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  // generate PNG buffer
  const buffer = await QRCode.toBuffer(qrCodeData, {
    type: "png",
    width: 500,
    color: {
      dark: "#000000",
      light: "#0000",
    },
  });

  // convert to data URI
  const dataUri = "data:image/png;base64," + buffer.toString("base64");

  // upload to Cloudinary
  let uploadResult;
  try {
    uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "qrCodes",
      public_id: safe,
      overwrite: true,
      resource_type: "image",
    });
  } catch (err: any) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload to Cloudinary" },
      { status: 500 }
    );
  }

  // record the hosted URL
  const hostedUrl = uploadResult.secure_url;

  // create or update in DB
  let record;
  if (qrId) {
    record = await prisma.qRCode.update({
      where: { id: qrId },
      data: {
        qrCodeUrl: hostedUrl,
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
        qrCodeUrl: hostedUrl,
      },
    });
  }

  return NextResponse.json({ data: record });
}
