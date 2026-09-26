import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Historique de vos alertes et rappels.
          </p>
        </div>
        <form action={async () => {
          "use server";
          await prisma.notification.updateMany({
            where: { userId: session.user.id, isRead: false },
            data: { isRead: true }
          });
        }}>
          <Button variant="outline" type="submit">Tout marquer lu</Button>
        </form>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Vous n&apos;avez aucune notification.</p>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={!n.isRead ? "border-primary" : "opacity-80"}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="font-semibold">{n.title}</h4>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
