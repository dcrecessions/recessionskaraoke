import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const {
      qrId,
      bloodGroup,
      medication,
      sickness,
      onDrugs,
      drugsName,
      doctorPhoneNumber,
      hospitalName,
    } = await request.json();

    const updatedPatient = await prisma.qRCode.update({
      where: { id: qrId },
      data: {
        bloodGroup,
        medication,
        sickness,
        onDrugs,
        drugsName,
        doctorPhoneNumber,
        hospitalName,
      },
    });

    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    // console.error("Error updating medical info:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
