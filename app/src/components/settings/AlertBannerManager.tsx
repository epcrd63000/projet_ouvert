"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, Trash2, PowerOff } from "lucide-react";

interface AlertData {
  id: string;
  message: string;
  level: string;
  isActive: boolean;
}

export function AlertBannerManager({ initialAlerts = [] }: { initialAlerts?: AlertData[] }) {
  const [alerts, setAlerts] = useState<AlertData[]>(initialAlerts);
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
        body: JSON.stringify({ message, level, isActive: true }),
      });

      if (res.ok) {
        const newAlert = await res.json();
        setAlerts([newAlert, ...alerts]);
        setMessage("");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la diffusion de l'alerte");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de communication avec le serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });

      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== id));
      } else {
        alert("Erreur lors de la désactivation");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Diffuser une alerte globale
        </CardTitle>
        <CardDescription>
          Créez une bannière visible par tous les utilisateurs de l'application.
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
              Diffuser
            </Button>
          </div>
        </form>

        {alerts.length > 0 && (
          <div className="pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3">Alertes actives</h3>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-md bg-secondary/20">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded mr-2 ${
                      alert.level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      alert.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.level}
                    </span>
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8"
                    onClick={() => handleDeactivate(alert.id)}
                    disabled={loading}
                    title="Désactiver l'alerte"
                  >
                    <PowerOff className="h-4 w-4 mr-2" />
                    Désactiver
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
