import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Forces the route to be dynamic and prevents caching

export async function POST(request: NextRequest) {
  try {
    // Get qrId from query params
    const qrId = request.nextUrl.searchParams.get("qrId");

    if (!qrId) {
      return NextResponse.json(
        { error: "QR code id is required" },
        { status: 400 }
      );
    }

    // Parse the JSON body for QR code details
    const {
      userId,
      victimName,
      victimSurname,
      victimEmail,
      victimHeight,
      victimWeight,
      victimAge,
      victimProfession,
      victimNationality,
      victimTelNumber,
      victimHouseNumber,
      victimAddress,
      victimCity,
      victimCountry,
      relative1Name,
      relative1Surname,
      relative1Address,
      relative1Phone,
      relative1Email,
      relative2Name,
      relative2Surname,
      relative2Address,
      relative2Phone,
      relative2Email,
      relative3Name,
      relative3Surname,
      relative3Address,
      relative3Phone,
      relative3Email,
      bloodGroup,
      onDrugs,
      drugsName,
      doctorPhoneNumber,
      sickness,
      medication,
      hospitalName,
      qrStatus,
    } = await request.json(); // Get the QR code details

    // Fetch the existing QR code from the database
    const existingQRCode = await prisma.qRCode.findUnique({
      where: { id: qrId },
    });

    if (!existingQRCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    //update the fields without re-generating the QR code
    const updatedQRCode = await prisma.qRCode.update({
      where: { id: qrId },
      data: {
        userId,
        victimName,
        victimSurname,
        victimEmail,
        victimHeight,
        victimWeight,
        victimAge,
        victimProfession,
        victimNationality,
        victimTelNumber,
        victimHouseNumber,
        victimAddress,
        victimCity,
        victimCountry,
        relative1Name,
        relative1Surname,
        relative1Address,
        relative1Phone,
        relative1Email,
        relative2Name,
        relative2Surname,
        relative2Address,
        relative2Phone,
        relative2Email,
        relative3Name,
        relative3Surname,
        relative3Address,
        relative3Phone,
        relative3Email,
        bloodGroup,
        onDrugs,
        drugsName,
        doctorPhoneNumber,
        sickness,
        medication,
        hospitalName,
        status: qrStatus || existingQRCode.status, // Keep existing status if not provided
      },
    });

    return NextResponse.json({
      message: "QR code updated successfully.",
      data: updatedQRCode,
    });
  } catch (error: any) {
    console.error("Error updating QR code:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
