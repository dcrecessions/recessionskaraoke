import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Signup",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster richColors />
    </>
  );
}
