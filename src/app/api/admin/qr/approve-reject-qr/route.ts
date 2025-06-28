import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import cloudinary from "@/utils/cloudinary"; // Assuming Cloudinary utility is correctly set up

export const dynamic = "force-dynamic"; // Forces the route to be dynamic and prevents caching

export async function POST(request: NextRequest) {
  // Fetch session using the correct method
  const session = await getServerSession(authOptions); // Use getServerSession without req

  // Check if the user is authenticated and has an admin role
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied. Admins only." },
      { status: 403 }
    );
  }
  try {
    const { qrId, approve } = await request.json(); // Get qrId, approve, and additional details if needed

    // Check if the QR code exists in the database
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: qrId },
    });

    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    // Generate QR code if approve is true (you can modify condition as needed)
    let qrCodeUrl = qrCode.qrCodeUrl; // Keep the existing QR code URL if not generating a new one
    if (approve) {
      //   const qrData = `${name}, ${email}, ${username}`; // Customize QR data as needed
      const qrData = `${process.env.DOMAIN}/signup?&qrCodeId=${qrId}`;
      console.log(qrData);

      // Generate QR code as a Base64 string
      const qrBase64 = await QRCode.toDataURL(qrData);

      // Upload QR code to Cloudinary
      const cloudinaryResponse = await cloudinary.uploader.upload(qrBase64, {
        folder: "qrcodes", // Organize files into a folder in Cloudinary
        public_id: qrId, // Save with the same public ID to link with the qrId
        resource_type: "image",
      });

      qrCodeUrl = cloudinaryResponse.secure_url; // Update the QR code URL from Cloudinary
    }

    // Update the QR code status based on the approval or rejection
    const updatedQRCode = await prisma.qRCode.update({
      where: { id: qrId },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        qrCodeUrl, // Store the updated QR code URL (either the existing or new one)
      },
    });

    return NextResponse.json({
      message: `QR code ${approve ? "approved" : "rejected"} successfully.`,
      data: updatedQRCode,
    });
  } catch (error: any) {
    console.error("Error updating QR code status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
