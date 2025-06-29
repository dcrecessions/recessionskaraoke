"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SongRequest = {
  id: string;
  name: string;
  email: string;
  song: string;
  createdAt: string;
};

export default function ControlPanelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [approved, setApproved] = useState<SongRequest[]>([]);
  const [pending, setPending] = useState<SongRequest[]>([]);
  const [played, setPlayed] = useState<SongRequest[]>([]);
  const [discarded, setDiscarded] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch both lists
  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, pRes, plRes, remRes, skRes] = await Promise.all([
        axios.get<{ data: SongRequest[] }>(
          "/api/admin/song-requests?status=APPROVED"
        ),
        axios.get<{ data: SongRequest[] }>(
          "/api/admin/song-requests?status=PENDING"
        ),
        axios.get<{ data: SongRequest[] }>(
          "/api/admin/song-requests?status=PLAYED"
        ),
        axios.get<{ data: SongRequest[] }>(
          "/api/admin/song-requests?status=REMOVED"
        ),
        axios.get<{ data: SongRequest[] }>(
          "/api/admin/song-requests?status=SKIPPED"
        ),
      ]);
      setApproved(aRes.data.data);
      setPending(pRes.data.data);
      setPlayed(plRes.data.data);
      // combine removed + skipped
      setDiscarded([...remRes.data.data, ...skRes.data.data]);
    } catch (err) {
      console.error(err);
      toast("Error", { description: "Failed to load queues." });
    } finally {
      setLoading(false);
    }
  }, []);

  // Restrict to ADMIN and fetch on mount
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/dashboard");
    } else {
      fetchLists();
      // auto-poll every 20s
      const h = setInterval(fetchLists, 20_000);
      return () => clearInterval(h);
    }
  }, [status, session, fetchLists, router]);

  // Handle status changes
  const handleAction = async (
    id: string,
    newStatus: "APPROVED" | "SKIPPED" | "REMOVED" | "PLAYED" | "PENDING"
  ) => {
    setLoading(true);
    try {
      await axios.patch("/api/admin/song-requests/" + id, {
        status: newStatus,
      });
      toast.success("Success", {
        description:
          newStatus === "APPROVED"
            ? "Added to queue."
            : newStatus === "SKIPPED"
            ? "Request skipped."
            : newStatus === "REMOVED"
            ? "Removed from queue."
            : newStatus === "PLAYED"
            ? "Marked as played."
            : "", // no message needed for PENDING re-requests
      });
      fetchLists();
    } catch (err) {
      console.error(err);
      toast.error("Error", { description: "Action failed." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-6">
      {/* refresh button */}
      <div className="flex-1 flex justify-end items-center">
        <Button onClick={fetchLists} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {/* ─── STATS CARDS + REFRESH ───────────────────────────── */}
      <div className="flex items-start justify-between">
        {/* grid of 4 small cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">In Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{approved.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pending.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Played</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{played.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Discarded</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{discarded.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approved Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Current Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <p className="text-center py-4">No songs in queue.</p>
          ) : (
            <Table>
              <TableCaption>Approved requests waiting in queue</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{r.song}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(r.id, "PLAYED")}
                        disabled={loading}
                        className="bg-blue-500 text-white"
                      >
                        Done Playing
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(r.id, "REMOVED")}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>New Song Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-center py-4">No pending requests.</p>
          ) : (
            <Table>
              <TableCaption>Requests awaiting approval</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{r.song}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(r.id, "APPROVED")}
                        disabled={loading}
                      >
                        Add to Queue
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(r.id, "SKIPPED")}
                        disabled={loading}
                      >
                        Skip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Played Songs */}
      <Card>
        <CardHeader>
          <CardTitle>Played Songs</CardTitle>
        </CardHeader>
        <CardContent>
          {played.length === 0 ? (
            <p className="text-center py-4">No played songs yet.</p>
          ) : (
            <Table>
              <TableCaption>Songs already played today</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {played.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{r.song}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(r.id, "APPROVED")}
                        disabled={loading}
                      >
                        Re-Queue
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(r.id, "PENDING")}
                        disabled={loading}
                      >
                        Re-Request
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Discarded (Removed & Skipped) */}
      <Card>
        <CardHeader>
          <CardTitle>Discarded Songs</CardTitle>
        </CardHeader>
        <CardContent>
          {discarded.length === 0 ? (
            <p className="text-center py-4">No discarded songs.</p>
          ) : (
            <Table>
              <TableCaption>Removed or skipped requests</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discarded.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{r.song}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(r.id, "APPROVED")}
                        disabled={loading}
                      >
                        Add to Queue
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(r.id, "PENDING")}
                        disabled={loading}
                      >
                        Add to Pending
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
