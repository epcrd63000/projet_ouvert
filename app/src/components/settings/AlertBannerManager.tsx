"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone } from "lucide-react";

export function AlertBannerManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<"INFO" | "WARNING" | "CRITICAL">("INFO");

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, level }),
      });

      if (res.ok) {
        alert("Notification diffusée à toute l'équipe avec succès");
        setMessage("");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la diffusion");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de communication avec le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Diffuser une notification globale
        </CardTitle>
        <CardDescription>
          Envoyez une notification système à tous les membres de l&apos;équipe (visible dans la cloche).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="alert-msg">Message de l&apos;alerte</Label>
            <Input
              id="alert-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Maintenance prévue ce soir à 20h"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="alert-level">Niveau de gravité</Label>
            <select
              id="alert-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="w-full rounded-md border p-2 text-sm bg-background"
            >
              <option value="INFO">Information (INFO)</option>
              <option value="WARNING">Avertissement (WARNING)</option>
              <option value="CRITICAL">Critique (CRITICAL)</option>
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading || !message.trim()}>
              Diffuser à l&apos;équipe
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
