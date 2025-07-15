import React, { Suspense } from "react";

export const metadata = {
  title: "Verify Email - Recessions DC",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
