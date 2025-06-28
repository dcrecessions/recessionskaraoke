"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function QRScannerPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [isClient, setIsClient] = useState(false); // Ensure client-side rendering

  useEffect(() => {
    // This ensures the component renders only on the client side
    setIsClient(true);
  }, []);

  const isValidURL = (url: string): boolean => {
    try {
      new URL(url); // If this succeeds, it's a valid URL
      return true;
    } catch {
      return false;
    }
  };

  const handleScan = (result: string | null) => {
    if (!result) return;

    try {
      // Validate if the scanned result is a valid URL
      if (!isValidURL(result)) {
        toast.error("Invalid QR Code", {
          description: "The QR code does not contain a valid URL.",
        });
        return;
      }

      // Extract qrID from the scanned URL
      const url = new URL(result);
      const qrID = url.searchParams.get("qrCodeId");

      if (!qrID) {
        toast.error("Invalid QR Code", {
          description: "The QR code does not contain valid registration data.",
        });
        return;
      }
      //   console.log("redirecting to signup page with qrID:", qrID);
      // Redirect to signup page with the qrID
      router.push(`/signup?qrCodeId=${qrID}`);
    } catch (error) {
      console.error("Error processing QR code:", error);
      toast.error("Error", {
        description: "Failed to process QR code.",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 bg-[#EFEEE7] h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">
        Scan QR Code to Register
      </h1>

      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          {isClient ? (
            scanning ? (
              <BarcodeScannerComponent
                width="100%"
                height={400}
                onUpdate={(err, result) => {
                  if (result) {
                    handleScan(result.getText());
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
