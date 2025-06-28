"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QRCodeItem = {
  id: string;
  qrCodeUrl: string;
  qrCodeData: string;
  status: string;
  createdAt: string;
};

export default function QRListPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState("");

  // fetch all QR codes
  const fetchQrCodes = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ data: QRCodeItem[] }>(
        "/api/qr/get-all-qrcodes"
      );
      setQrCodes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrCodes();
  }, []);

  // delete handler
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this QR code?")) return;
    try {
      await axios.delete(`/api/qr/delete-qrcode?qrId=${id}`);
      setQrCodes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // open edit dialog
  const openEdit = (q: QRCodeItem) => {
    setEditingId(q.id);
    setEditData(q.qrCodeData);
  };

  // save edited QR data
  const handleSaveEdit = async () => {
    if (!editingId) return;
    const original = qrCodes.find((q) => q.id === editingId);
    // if unchanged, just close
    if (original?.qrCodeData === editData) {
      setEditingId(null);
      return;
    }
    try {
      await axios.post("/api/qr/generate-qr", {
        qrId: editingId,
        qrCodeData: editData,
        reqStatus: "UPDATED",
      });
      await fetchQrCodes();
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // print to PDF
  const handlePrint = (q: QRCodeItem) => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.text("DC Recessions Karaoke", 20, 30);
    doc.setFontSize(16);
    doc.text("Scan this QR code to request your song", 20, 50);
    doc.addImage(q.qrCodeUrl, "PNG", 20, 60, 160, 160);
    doc.save(`qrcode-${q.id}.pdf`);
  };

  if (loading) return <p className="p-8 text-center">Loading…</p>;

  return (
    <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      {qrCodes.map((q) => (
        <Card key={q.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="truncate">{q.qrCodeData}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <img
              src={q.qrCodeUrl}
              alt={q.qrCodeData}
              className="w-full h-auto object-contain"
            />
            <p className="mt-2 text-sm text-gray-600">Status: {q.status}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Dialog
              open={editingId === q.id}
              onOpenChange={(open) => {
                if (!open) setEditingId(null);
              }}
            >
              <DialogTrigger asChild>
                {/* fire both the dialog’s toggle and our setter */}
                <Button
                  size="sm"
                  onClick={() => {
                    openEdit(q);
                  }}
                >
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit QR Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Label htmlFor="edit-qr">QR Code Data</Label>
                  <Input
                    id="edit-qr"
                    value={editData}
                    onChange={(e) => setEditData(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveEdit}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(q.id)}
            >
              Delete
            </Button>
            <Button size="sm" onClick={() => handlePrint(q)}>
              Print
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
