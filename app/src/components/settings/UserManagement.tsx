"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2, X } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: Date | string;
}

export function UserManagement({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserItem[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulaire d'ajout
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers([...users, newUser]);
        setIsModalOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("MEMBER");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création de l'utilisateur");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de communication avec le serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "MEMBER") => {
    if (userId === currentUserId && newRole !== "ADMIN") {
      if (!confirm("Attention : vous allez révoquer vos propres droits administrateur. Continuer ?")) {
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la modification du rôle");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'utilisateur "${user.name}" (${user.email}) ?\nSes tâches et réunions créées seront conservées (orphelines).`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== user.id));
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la suppression");
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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Membres de l&apos;équipe</CardTitle>
        <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" /> Nouvel utilisateur
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">Nom</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rôle</th>
                <th className="p-3">Inscrit le</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3 font-medium">
                    {u.name} {u.id === currentUserId && <span className="text-xs text-muted-foreground">(vous)</span>}
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as "ADMIN" | "MEMBER")}
                      className="p-1 rounded bg-background border text-xs font-semibold"
                      disabled={loading}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>
                  </td>
                  <td className="p-3">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(u)}
                      disabled={loading || (u.id === currentUserId && users.filter((x) => x.role === "ADMIN").length <= 1)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title={u.id === currentUserId ? "Impossible de vous auto-supprimer" : "Supprimer"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modale d'ajout d'utilisateur */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-lg shadow-xl border w-full max-w-md p-6 relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold mb-4">Créer un Utilisateur</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="u-name">Nom complet *</Label>
                  <Input
                    id="u-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Sophie Martin"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="u-email">Adresse Email *</Label>
                  <Input
                    id="u-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sophie.martin@etu.imt-nord-europe.fr"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="u-pwd">Mot de passe provisoire *</Label>
                  <Input
                    id="u-pwd"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    minLength={6}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="u-role">Rôle</Label>
                  <select
                    id="u-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
                    className="w-full rounded-md border p-2 text-sm bg-background"
                  >
                    <option value="MEMBER">Membre (MEMBER)</option>
                    <option value="ADMIN">Administrateur (ADMIN)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Créer l&apos;utilisateur
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
