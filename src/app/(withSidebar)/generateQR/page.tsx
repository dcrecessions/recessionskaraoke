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
    qrCodeData: "",
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
            qrCodeData: data.qrCodeData || "",
            qrStatus: data.status || "UPDATED",
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
        : "/api/qr/generate-qr"; // New QR creation API

      const requestData = {
        ...qrDetails,
        userId,
        reqStatus: isEditing ? "UPDATED" : "NEW", // Different status depending on edit or new
      };

      // Submit the form data
      await axios.post(url, requestData);

      // Notify success
      toast.success(isEditing ? "Success" : "Created", {
        description: isEditing
          ? "QR code updated successfully!"
          : "QR code created successfully!",
      });

      router.push("/admin/qr-management"); // Redirect after success
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
              ? "Edit QR Code"
              : "Generate QR Code"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full gap-4">
              {/* QR Code Data */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="qrCodeData">QR Code Data</Label>
                <Input
                  id="qrCodeData"
                  type="text"
                  value={qrDetails.qrCodeData}
                  onChange={(e) =>
                    handleInputChange("qrCodeData", e.target.value)
                  }
                  placeholder="Enter QR Code Data"
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
            onClick={() => router.push("/admin/qr-management")}
            className="w-full sm:w-auto ml-2"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
