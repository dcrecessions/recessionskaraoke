"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function GenerateQRPage() {
  const router = useRouter();

  // Get the user session using NextAuth's useSession hook
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [qrDetails, setQRDetails] = useState({
    victimName: "",
    victimSurname: "",
    victimEmail: "",
    victimHeight: "",
    victimWeight: "",
    victimAge: "",
    victimProfession: "",
    victimNationality: "",
    victimTelNumber: "",
    victimHouseNumber: "",
    victimAddress: "",
    victimCity: "",
    victimCountry: "",
    relative1Name: "",
    relative1Surname: "",
    relative1Address: "",
    relative1Phone: "",
    relative1Email: "",
    relative2Name: "",
    relative2Surname: "",
    relative2Address: "",
    relative2Phone: "",
    relative2Email: "",
    relative3Name: "",
    relative3Surname: "",
    relative3Address: "",
    relative3Phone: "",
    relative3Email: "",
    bloodGroup: "",
    onDrugs: false,
    drugsName: "",
    doctorPhoneNumber: "",
    sickness: "",
    medication: "",
    hospitalName: "",
    qrStatus: "",
  });

  // Handle input changes dynamically
  const handleInputChange = (field: string, value: string | boolean) => {
    setQRDetails({ ...qrDetails, [field]: value });
  };

  // Fetch QR details if qrId is passed
  useEffect(() => {
    const qrCodeId = searchParams.get("id");
    if (qrCodeId) {
      setIsEditing(true); // Set the flag for editing
      // Fetch the QR details from DB using qrId
      axios
        .get(`/api/qr/get-single-qr?qrId=${qrCodeId}`) // Assuming you have an API endpoint to get QR details
        .then((response) => {
          const data = response.data;
          setQRDetails({
            victimName: data.victimName || "",
            victimSurname: data.victimSurname || "",
            victimEmail: data.victimEmail || "",
            victimHeight: data.victimHeight || null,
            victimWeight: data.victimWeight || null,
            victimAge: data.victimAge || null,
            victimProfession: data.victimProfession || "",
            victimNationality: data.victimNationality || "",
            victimTelNumber: data.victimTelNumber || "",
            victimHouseNumber: data.victimHouseNumber || "",
            victimAddress: data.victimAddress || "",
            victimCity: data.victimCity || "",
            victimCountry: data.victimCountry || "",
            relative1Name: data.relative1Name || "",
            relative1Surname: data.relative1Surname || "",
            relative1Address: data.relative1Address || "",
            relative1Phone: data.relative1Phone || "",
            relative1Email: data.relative1Email || "",
            relative2Name: data.relative2Name || "",
            relative2Surname: data.relative2Surname || "",
            relative2Address: data.relative2Address || "",
            relative2Phone: data.relative2Phone || "",
            relative2Email: data.relative2Email || "",
            relative3Name: data.relative3Name || "",
            relative3Surname: data.relative3Surname || "",
            relative3Address: data.relative3Address || "",
            relative3Phone: data.relative3Phone || "",
            relative3Email: data.relative3Email || "",
            bloodGroup: data.bloodGroup || "",
            onDrugs: data.onDrugs || false,
            drugsName: data.drugsName || "",
            doctorPhoneNumber: data.doctorPhoneNumber || "",
            sickness: data.sickness || "",
            medication: data.medication || "",
            hospitalName: data.hospitalName || "",
            qrStatus: data.status || "PENDING",
          });
        })
        .catch((error) => {
          console.error("Error fetching QR code details:", error);
          toast.error("Error", {
            description: "Unable to fetch QR code details.",
          });
        });
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Ensure the session is available
      if (!session || !session.user) {
        toast.error("Error", {
          description: "User not logged in.",
        });
        return;
      }
      // Get the userId from session
      const userId = session.user.id;

      const qrId = searchParams.get("id");

      const url = isEditing
        ? `/api/qr/update-qr?qrId=${qrId}` // Update API if editing
        : "/api/qr/request-approval"; // New QR creation API

      const requestData = {
        ...qrDetails,
        userId,
        reqStatus: isEditing ? "PENDING" : "NEW", // Different status depending on edit or new
      };

      // Submit the form data
      await axios.post(url, requestData);

      // Notify success
      toast.success(isEditing ? "Success" : "Created", {
        description: isEditing
          ? "QR code updated successfully!"
          : "QR code creation request submitted successfully! Awaiting approval.",
      });

      router.push("/dashboard"); // Redirect after success
    } catch (error) {
      console.log(
        `error ${isEditing ? "updating" : "creating"} QR code: ${error}`
      );
      toast.error("Error", {
        description: "An error occurred while processing the QR code.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-start min-h-screen py-8">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            {loading
              ? "Processing"
              : isEditing
              ? "Edit Qr Code"
              : "Generate Qr Code"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full gap-4">
              {/* Victim Details */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="victimName">Victim Name</Label>
                <Input
                  id="victimName"
                  type="text"
                  value={qrDetails.victimName}
                  onChange={(e) =>
                    handleInputChange("victimName", e.target.value)
                  }
                  placeholder="Victim Name"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="victimSurname">Victim Surname</Label>
                <Input
                  id="victimSurname"
                  type="text"
                  value={qrDetails.victimSurname}
                  onChange={(e) =>
                    handleInputChange("victimSurname", e.target.value)
                  }
                  placeholder="Victim Surname"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-start gap-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? isEditing
                ? "Editing"
                : "Creating"
              : isEditing
              ? "Edit QR Code"
              : "Generate QR Code"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto ml-2"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
