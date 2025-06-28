"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Stats = {
  queueCount: number;
  pendingCount: number;
  playedCount: number;
  discardedCount: number;
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ data: Stats }>("/api/dashboard-stats");
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
    } else {
      fetchStats();
      // set up auto-refresh every 45 seconds
      const iv = setInterval(fetchStats, 45_000);
      return () => clearInterval(iv);
    }
  }, [status, session, router, fetchStats]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <Button onClick={fetchStats} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total in Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.queueCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.pendingCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Songs Played</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.playedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discarded Songs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.discardedCount}</p>
          </CardContent>
        </Card>

        <Card className="wid-full col-span-1 sm:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-4xl font-bold">
              Please send your Whatsapp number and email address to
              sumedhtirodkar16@gmail.com
              <br />
              <br />
              <br /> Do not mention about this on Fívéř.
            </CardTitle>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
    </div>
  );
}
