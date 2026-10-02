"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UserSettings() {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [defaultTasksView, setDefaultTasksView] = useState("board");
  const [defaultEventsView, setDefaultEventsView] = useState("agenda");

  useEffect(() => {
    setDefaultTasksView(localStorage.getItem("defaultTasksView") || "board");
    setDefaultEventsView(localStorage.getItem("defaultEventsView") || "agenda");
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      
      if (res.ok) {
        alert("Mot de passe mis à jour");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const error = await res.json();
        alert(error.error || "Erreur de mise à jour");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
  };

  const savePreferences = () => {
    localStorage.setItem("defaultTasksView", defaultTasksView);
    localStorage.setItem("defaultEventsView", defaultEventsView);
    alert("Préférences enregistrées");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe actuel</label>
              <input
                type="password"
                required
                className="w-full rounded-md border p-2 bg-background text-foreground"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                className="w-full rounded-md border p-2 bg-background text-foreground"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                required
                className="w-full rounded-md border p-2 bg-background text-foreground"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit">Mettre à jour</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Préférences d&apos;affichage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Vue par défaut des tâches</label>
            <select
              className="w-full rounded-md border p-2 bg-background text-foreground"
              value={defaultTasksView}
              onChange={(e) => setDefaultTasksView(e.target.value)}
            >
              <option value="board">Kanban (Board)</option>
              <option value="list">Liste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vue par défaut du calendrier</label>
            <select
              className="w-full rounded-md border p-2 bg-background text-foreground"
              value={defaultEventsView}
              onChange={(e) => setDefaultEventsView(e.target.value)}
            >
              <option value="agenda">Agenda</option>
              <option value="month">Mois</option>
              <option value="week">Semaine</option>
            </select>
          </div>
          <Button onClick={savePreferences} variant="secondary">Enregistrer les préférences</Button>
        </CardContent>
      </Card>
    </div>
  );
}

