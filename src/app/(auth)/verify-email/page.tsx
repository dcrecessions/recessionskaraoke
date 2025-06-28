"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = useTranslations("VerifyEmail");
  const emailVerifyToken = searchParams.get("token");
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const verifyToken = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/users/verify-email", {
        emailVerifyToken,
      });
      toast({ title: "Success", description: response.data.message });
      setIsVerified(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to verify email.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>
            {isVerified ? t("title.verified") : t("title.unverified")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isVerified ? (
            <p>{t("messages.success")}</p>
          ) : (
            <Button onClick={verifyToken} disabled={loading}>
              {loading ? t("messages.processing") : t("title.unverified")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
