// THIS REQUEST WILL SAVE DATA TO DB AS WELL AS NOTIFY THE ADMIN USER
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendAdminNotification } from "@/helpers/notifyAdmin";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
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
      status,
    } = reqBody;

    // Save the QR code details to the database
    const qrCode = await prisma.qRCode.create({
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
        status,
      },
    });

    // Notify the admin (custom notification logic)
    await sendAdminNotification(qrCode); // Helper function to send notification

    return NextResponse.json({
      message: "QR code created successfully!",
      success: true,
    });
  } catch (error: any) {
    // console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
