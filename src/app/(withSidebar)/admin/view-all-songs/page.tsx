"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  status: string;
  statusBy?: { name: string };
  statusChanged?: string;
};

export default function ViewAllSongsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState<SongRequest[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<{
        data: SongRequest[];
        total: number;
      }>("/api/admin/get-delete-all-song-requests", {
        params: {
          page,
          pageSize,
          search,
          status: statusFilter,
          from: dateFrom,
          to: dateTo,
        },
      });
      setRecords(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      toast("Error", { description: "Failed to load records." });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/dashboard");
    } else {
      fetchRecords();
    }
  }, [status, session, fetchRecords, router]);

  // selection handlers
  const toggleSelectAll = () => {
    if (selected.length === records.length) {
      setSelected([]);
    } else {
      setSelected(records.map((r) => r.id));
    }
  };
  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // bulk actions
  const handleBulkApprove = async () => {
    setLoading(true);
    try {
      await Promise.all(
        selected.map((id) =>
          axios.patch(`/api/admin/song-requests/${id}`, { status: "APPROVED" })
        )
      );
      toast.success("Added to queue");
      setSelected([]);
      fetchRecords();
    } catch {
      toast.error("Bulk action failed");
      setLoading(false);
    }
  };
  const handleDeleteSelected = async () => {
    setLoading(true);
    try {
      await axios.delete("/api/admin/delete-song-requests", {
        data: { ids: selected },
      });
      toast.success("Deleted selected");
      setSelected([]);
      fetchRecords();
    } catch {
      toast.error("Bulk delete failed");
      setLoading(false);
    }
  };
  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL requests? This cannot be undone.")) return;
    setLoading(true);
    try {
      await axios.delete("/api/admin/delete-song-requests");
      toast.success("All records deleted");
      fetchRecords();
    } catch {
      toast.error("Delete all failed");
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Song Requests History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-2 items-end">
            {/* Search */}
            <Input
              placeholder="Search by song, name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="col-span-1 sm:col-span-2 w-full"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="col-span-1 w-full border rounded px-2 py-1"
            >
              <option value="">All Statuses</option>
              {["PENDING", "APPROVED", "SKIPPED", "REMOVED", "PLAYED"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>

            {/* Date From */}
            <div className="flex flex-col col-span-1">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col col-span-1">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Apply / Clear (on its own line) */}
          <div className="flex justify-start gap-2 mb-6">
            <Button onClick={() => setPage(1)}>Apply</Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Button onClick={handleBulkApprove} disabled={!selected.length}>
              Add to Queue
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={!selected.length}
            >
              Delete Selected
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              Delete All
            </Button>
          </div>

          {/* Table */}
          <Table>
            <TableCaption>
              Showing page {page} of {totalPages}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={
                      selected.length === records.length && records.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Song</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Status By</TableHead>
                <TableHead>Status Changed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggleSelect(r.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(r.createdAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{r.song}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.statusBy?.name || "-"}</TableCell>
                  <TableCell>
                    {r.statusChanged
                      ? new Date(r.statusChanged).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
