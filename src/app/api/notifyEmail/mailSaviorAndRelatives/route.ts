import { NextRequest, NextResponse } from "next/server";
import {
  notifyRelatives,
  informSavior,
} from "@/helpers/mailSaviorAndRelatives";

export async function POST(request: NextRequest) {
  const { qrCodeData, saviorEmail, scanTime } = await request.json();

  try {
    await notifyRelatives(qrCodeData, saviorEmail, scanTime);
    await informSavior(qrCodeData, saviorEmail);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
