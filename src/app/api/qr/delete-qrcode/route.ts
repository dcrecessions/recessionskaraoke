import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import cloudinary from "@/utils/cloudinary";

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  try {
    // Extract the QR code ID from the query parameters
    const { searchParams } = new URL(request.url);
    const qrCodeId = searchParams.get("qrCodeId");

    if (!qrCodeId) {
      return NextResponse.json(
        { error: "QR Code ID is required for deletion" },
        { status: 400 }
      );
    }

    // Find the QR code in the database
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        accidentPhotos: true, // Include the related accident photos
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: "QR Code not found" }, { status: 404 });
    }

    // Delete the associated saviors first
    await prisma.saviorQRCode.deleteMany({
      where: { qrCodeId: qrCodeId },
    });

    for (const photo of qrCode.accidentPhotos) {
      if (photo.photoUrl) {
        const accidentPicPublicId = extractPublicId(photo.photoUrl);
        console.log("accidentPicPublicId:", accidentPicPublicId);

        if (accidentPicPublicId) {
          try {
            // Delete photo from Cloudinary
            const deleteResult = await cloudinary.uploader.destroy(
              accidentPicPublicId
            );
            console.log(
              "Cloudinary delete result for accident photo:",
              deleteResult
            );

            if (deleteResult.result === "ok") {
              console.log(
                `Successfully deleted accident photo with public ID: ${accidentPicPublicId}`
              );
            } else {
              console.log(
                `Failed to delete accident photo with public ID: ${accidentPicPublicId}. Result: ${deleteResult.result}`
              );
            }
          } catch (error) {
            console.error(
              `Error deleting accident photo with public ID: ${accidentPicPublicId}`,
              error
            );
          }
        }
      }
    }

    // Delete the QR code photo from Cloudinary (if exists)
    if (qrCode.qrCodeUrl) {
      const qrCodePublicId = extractPublicId(qrCode.qrCodeUrl);
      console.log("qrCodePublicId:", qrCodePublicId);

      if (qrCodePublicId) {
        try {
          // Delete the QR code image from Cloudinary
          const deleteResult = await cloudinary.uploader.destroy(
            qrCodePublicId
          );
          console.log(
            "Cloudinary delete result for QR code photo:",
            deleteResult
          );

          if (deleteResult.result === "ok") {
            console.log(
              `Successfully deleted QR code photo with public ID: ${qrCodePublicId}`
            );
          } else {
            console.log(
              `Failed to delete QR code photo with public ID: ${qrCodePublicId}. Result: ${deleteResult.result}`
            );
          }
        } catch (error) {
          console.error(
            `Error deleting QR code photo with public ID: ${qrCodePublicId}`,
            error
          );
        }
      }
    }

    await prisma.accidentPhoto.deleteMany({
      where: { qrCodeId: qrCodeId },
    });

    // Delete the QR code itself
    await prisma.qRCode.delete({
      where: { id: qrCodeId },
    });

    return NextResponse.json({
      message: "QR Code deleted successfully",
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting QR code:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to extract public ID from Cloudinary URL
function extractPublicId(url: string) {
  // Extract the public ID after '/v<version>/' and before the file extension
  const match = url.match(/\/v\d+\/(.*?)(?:\.[a-zA-Z0-9]{3,4}$|$)/);
  if (match && match[1]) {
    return match[1]; // Return the public ID
  }
  return null;
}
