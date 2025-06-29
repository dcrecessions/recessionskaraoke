"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Message = { type: "error" | "success"; text: string };

export default function LoginPage() {
  const router = useRouter();

  const [user, setUser] = React.useState({ email: "", password: "" });
  const [buttonDisabled, setButtonDisabled] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<Message | null>(null);
  const { data: session } = useSession();

  const onLogin = async () => {
    setMessage(null);

    if (!user.email || !user.password) {
      setMessage({
        type: "error",
        text: "Email and Password cannot be empty!",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await signIn("credentials", {
        redirect: false,
        email: user.email,
        password: user.password,
      });

      if (result?.error) {
        setMessage({
          type: "error",
          text: result.error || "Invalid credentials.",
        });
      } else {
        await checkSession();
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    const sess = await getSession();
    if (sess) {
      setMessage({ type: "success", text: "Login successful! Redirecting…" });
      setTimeout(() => {
        router.push("/dashboard");
      }, 600);
    } else {
      // retry briefly
      setTimeout(checkSession, 500);
    }
  };

  useEffect(() => {
    setButtonDisabled(!(user.email && user.password));
  }, [user]);

  return (
    <section className="position-relative bg-[url('/assets/login/login-bg.avif')] bg-center bg-cover">
      <div className="absolute inset-0 bg-black opacity-75" />
      <div className="relative container-fluid">
        <div className="grid grid-cols-1">
          <div className="lg:col-span-4">
            <div className="flex flex-col min-h-screen md:px-12 py-12 px-3">
              {/* Logo */}
              <div className="text-center mx-auto mb-4">
                <Link href="/">
                  <div className="flex justify-center mb-4 bg-transparent">
                    <Avatar
                      style={{
                        height: "4rem",
                        width: "12rem",
                        padding: "0.3rem",
                        borderRadius: "2rem",
                      }}
                    >
                      <AvatarImage src="/recessionsDCLogo.png" alt="Logo" />
                      <AvatarFallback>RECESSIONS</AvatarFallback>
                    </Avatar>
                  </div>
                </Link>
              </div>

              {/* Login Form */}
              <div className="my-auto">
                <div className="grid grid-cols-1 w-full max-w-sm m-auto px-6 py-4">
                  <Card className="w-[350px] z-10 py-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onLogin();
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-3xl text-center">
                          {loading ? "Processing..." : "Login"}
                        </CardTitle>
                      </CardHeader>
                      <CardDescription>
                        {/* Message Banner */}
                        {message && (
                          <div
                            className={`max-w-sm mx-auto mb-4 text-center ${
                              message.type === "error"
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {message.text}
                          </div>
                        )}
                      </CardDescription>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            className="p-2 border border-gray-400 rounded-lg mt-1 mb-4 focus:outline-none focus:border-gray-600 text-black"
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={user.email}
                            onChange={(e) =>
                              setUser({ ...user, email: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            className="p-2 border border-gray-400 rounded-lg mt-1 mb-4 focus:outline-none focus:border-gray-600 text-black"
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={user.password}
                            onChange={(e) =>
                              setUser({ ...user, password: e.target.value })
                            }
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col">
                        <Button
                          type="submit"
                          disabled={buttonDisabled || loading}
                          className="w-full bg-[#2970a8] text-white rounded-full py-3 my-3 hover:bg-[#6388bb] transition-colors animate-none hover:animate-bounceHover"
                        >
                          {loading ? "Logging in..." : "Login"}
                        </Button>
                        {/* <Button
                          variant="link"
                          asChild
                          className="text-blue-500 hover:underline mt-5"
                        >
                          <Link href="/signup">
                            Don't have an account? Sign up here
                          </Link>
                        </Button> */}
                      </CardFooter>
                    </form>
                  </Card>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center">
                <p className="text-gray-400">
                  © {new Date().getFullYear()} RecessionsDC. All rights
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
