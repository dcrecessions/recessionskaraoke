import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

// configure Cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

  // parse out the Cloudinary public_id
  try {
    const urlObj = new URL(record.qrCodeUrl);
    const segments = urlObj.pathname.split("/");
    // find the "qrCodes" segment
    const idx = segments.findIndex((s) => s === "qrCodes");
    if (idx !== -1 && segments.length > idx + 1) {
      const filename = segments[idx + 1]; // e.g. "safe.png"
      const publicId = `qrCodes/${filename.replace(/\.[^.]+$/, "")}`;
      // delete from Cloudinary
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
    }
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    // we’ll still proceed to delete the DB row
  }

  // delete DB row
  await prisma.qRCode.delete({ where: { id: qrId } });

  return NextResponse.json({ success: true });
}
