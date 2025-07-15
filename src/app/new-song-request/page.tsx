"use client";

import React, { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SpotifyTrack = { id: string; name: string };

export default function SongRequestFormPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SpotifyTrack[]>([]);
  const [song, setSong] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // bootstrap token into localStorage on mount
  useEffect(() => {
    async function initToken() {
      const expires = localStorage.getItem("spotify_token_expires");
      if (!expires || new Date(expires) < new Date()) {
        try {
          const res = await axios.get("/api/spotify/get-token");
          localStorage.setItem("spotify_token", res.data.token);
          localStorage.setItem("spotify_token_expires", res.data.expiresAt);
        } catch (err) {
          console.error("Could not fetch Spotify token", err);
          setError("Could not fetch Spotify token. Please try again later.");
        }
      }
    }
    initToken();
  }, []);

  // typeahead effect
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setError("");
      try {
        // re-check expiry if necessary
        const expires = localStorage.getItem("spotify_token_expires");
        if (!expires || new Date(expires) < new Date()) {
          const tokRes = await axios.get("/api/spotify/get-token");
          localStorage.setItem("spotify_token", tokRes.data.token);
          localStorage.setItem("spotify_token_expires", tokRes.data.expiresAt);
        }
        const token = localStorage.getItem("spotify_token")!;
        const resp = await axios.get("https://api.spotify.com/v1/search", {
          params: { q: query, type: "track", limit: 5 },
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuggestions(
          resp.data.tracks.items.map((t: any) => ({
            id: t.id,
            name: `${t.name} — ${t.artists.map((a: any) => a.name).join(", ")}`,
          }))
        );
      } catch (err: any) {
        setSuggestions([]);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Could not fetch song suggestions. Please try again."
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!song) {
        setError("Please select a song.");
        return;
      }
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }

      setLoading(true);
      try {
        // duplicate check against only APPROVED or PENDING songs
        const approvedRes = await axios.get<{ data: { song: string }[] }>(
          "/api/public-song-requests/get-pending-and-approved-songs"
        );
        const already = approvedRes.data.data.some((r) => r.song === song);
        if (already) {
          setError("That song is already queued!");
          return;
        }

        // 1) make the request
        const makeRes = await axios.post<{
          data: { id: string; song: string };
        }>("/api/public-song-requests/make-song-request", {
          name,
          email,
          song,
        });

        // 2) re-fetch the combined queue
        const queueRes = await axios.get<{
          data: { id: string; song: string }[];
        }>("/api/public-song-requests/get-pending-and-approved-songs");

        // 3) compute your position
        const idx = queueRes.data.data.findIndex(
          (r) => r.id === makeRes.data.data.id
        );
        const position = idx >= 0 ? idx + 1 : queueRes.data.data.length;

        setSuccess(
          `Your request has been received! Your song is number ${position} in the queue.`
        );

        // clear form
        setSong("");
        setQuery("");
        setName("");
        setEmail("");
      } catch {
        setError("Failed to submit your request. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [song, name, email]
  );

  return (
    <div
      className="min-h-screen flex flex-col
       bg-[url('/assets/homepage/home_bg.jpeg')]
       bg-cover bg-center"
    >
      <header className="flex items-center justify-between p-4 bg-black shadow">
        <Link href="/">
          <img
            src="/recessionsDCLogo.png"
            alt="Recessions DC Logo"
            className="h-10"
          />
        </Link>
        <Link href="/login">
          <Button variant="ghost" className="text-amber-100 border">
            Admin Login
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-2xl bg-[#ffffff]">
          <CardHeader>
            <CardTitle>Request a Song</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-500 mb-4">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Label htmlFor="song">Song Title</Label>
                <Input
                  id="song"
                  value={song || query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSong("");
                    setError("");
                  }}
                  placeholder="Start typing a song..."
                  autoComplete="off"
                />
                {!song && suggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto mt-1">
                    {suggestions.map((t) => (
                      <li
                        key={t.id}
                        className="px-2 py-1 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          setSong(t.name);
                          setQuery(t.name);
                          setSuggestions([]);
                        }}
                      >
                        {t.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              type="submit"
              onClick={(e) => handleSubmit(e)}
              disabled={loading}
              className="px-5 text-xl py-5 rounded-lg bg-[#202020] "
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
