"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useSession, signIn } from "next-auth/react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();

  const searchParams = useSearchParams(); // Extract query params
  const qrCodeId = searchParams.get("qrCodeId"); // Get `qrCodeId` if present

  const { data: session, status } = useSession(); // Fetch session data

  const [user, setUser] = React.useState({
    email: "",
    password: "",
    name: "",
  });
  const [buttonDisabled, setButtonDisabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const linkQrToAlreadyLoggedInUser = useCallback(async () => {
    console.log("inside linkQrToAlreadyLoggedInUser");
    try {
      setLoading(true);

      const userId = session?.user?.id;
      if (!userId) {
        toast.error("Error", {
          description: "User is not authenticated, unable to link QR code.",
        });
      }
      const response = await axios.post(
        "/api/savior/link-qr-already-loggedin-user",
        {
          qrCodeId,
          userId,
        }
      );
      console.log("QR code linked", response.data);
      // console.log("redirect to victim information commented out");
      router.push(`/victim-information?qrCodeId=${qrCodeId}&notifyBoth=true`);
    } catch (error: any) {
      console.error("Error linking QR code:", error.message);
      toast.error("Error", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [qrCodeId, session?.user?.id, router, toast]);

  useEffect(() => {
    // console.log("SignupPage useEffect has been called");
    // console.log("status:", status);
    // console.log("user id in session", session?.user?.id);
    // Check if user is already logged in
    if (status === "authenticated" && qrCodeId && session?.user?.id) {
      // Redirect to victim information page if `qrCodeId` is present
      linkQrToAlreadyLoggedInUser();
    }
  }, [status, qrCodeId, session?.user?.id, linkQrToAlreadyLoggedInUser]);

  const onSignup = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/users/signup", {
        ...user,
        qrCodeId, // Include `qrCodeId` in the request
      });
      console.log("Signup success", response.data);
      toast.success("Success", {
        description: "Signup successful!",
      });
      if (qrCodeId) {
        // If `qrCodeId` is present, log in the user programmatically
        const loginResponse = await signIn("credentials", {
          redirect: false,
          email: user.email,
          password: user.password,
        });

        if (loginResponse?.error) {
          toast.error("Login Failed", {
            description:
              "Unable to log in after registration. Please try again.",
          });
          return;
        }

        console.log("Login success", loginResponse);
        toast.success("Logged in", {
          description: "You are now logged in.",
        });

        // Redirect to the victim information page
        router.push(`/victim-information?qrCodeId=${qrCodeId}&notifyBoth=true`);
      } else {
        // Normal flow: redirect to login page
        router.push("/login");
      }
    } catch (error: any) {
      console.log("Signup failed", error.message);
      toast.error("Error", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      user.email.length > 0 &&
      user.password.length > 0 &&
      user.name.length > 0
    ) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [user]);

  return (
    <section className="position-relative bg-[url('/assets/login-bg.jpg')] bg-center bg-cover">
      <div className="absolute inset-0 bg-black opacity-75"></div>
      <div className="container-fluid relative">
        <div className="grid grid-cols-1">
          <div className="lg:col-span-4">
            <div className="flex flex-col min-h-screen md:px-12 py-12 px-3">
              {/* <!-- Start Logo --> */}
              <div className="text-center mx-auto">
                <Link href="/">
                  <div className="flex justify-center mb-4 bg-white rounded-lg">
                    <Avatar style={{ height: "5rem", width: "5rem" }}>
                      <AvatarImage
                        src="../../scanneSauverLogo.png"
                        alt="Logo"
                      />
                      <AvatarFallback>X</AvatarFallback>
                    </Avatar>
                  </div>
                </Link>
              </div>
              {/* <!-- End Logo --> */}

              {/* <!-- Start Content --> */}
              <div className="my-auto">
                <div className="grid grid-cols-1 w-full max-w-sm m-auto px-6 py-4">
                  <Card className="w-[350px]">
                    <CardHeader>
                      <CardTitle className="text-3xl text-center">
                        {loading ? "Processing" : "Signup"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form>
                        <div className="grid w-full items-center gap-4">
                          <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 text-black"
                              id="name"
                              type="text"
                              autoComplete="name"
                              value={user.name}
                              onChange={(e) =>
                                setUser({ ...user, name: e.target.value })
                              }
                              placeholder="Name"
                            />
                          </div>
                          <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 text-black"
                              id="email"
                              type="text"
                              autoComplete="email"
                              value={user.email}
                              onChange={(e) =>
                                setUser({ ...user, email: e.target.value })
                              }
                              placeholder="Email"
                            />
                          </div>
                          <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 text-black"
                              id="password"
                              type="password"
                              autoComplete="current-password"
                              value={user.password}
                              onChange={(e) =>
                                setUser({ ...user, password: e.target.value })
                              }
                              placeholder="Password"
                            />
                          </div>
                        </div>
                      </form>
                    </CardContent>
                    <CardFooter className="flex flex-col">
                      <Button
                        onClick={onSignup}
                        disabled={buttonDisabled || loading}
                        className="w-full bg-green-600 text-white rounded-full py-3 hover:bg-green-700 transition-colors animate-none hover:animate-bounceHover"
                      >
                        {loading ? "Signing up..." : "Signup"}
                      </Button>
                      <Button
                        variant="link"
                        asChild
                        className="text-blue-500 hover:underline mt-5"
                      >
                        <Link
                          href={
                            qrCodeId ? `/login?qrCodeId=${qrCodeId}` : "/login"
                          }
                        >
                          Already have an account? Login here
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              {/* <!-- End Content --> */}

              {/* <!-- Start Footer --> */}
              <div className="text-center">
                <p className="text-gray-400">
                  © {new Date().getFullYear()} ScannePourSauver. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
