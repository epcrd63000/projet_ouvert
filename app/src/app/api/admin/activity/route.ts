import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getWeekDateRange,
  calculateMemberWeeklyActivity,
  calculateActivitySummary,
} from "@/lib/dashboard/adminActivityMetrics";

export const dynamic = "force-dynamic";

/**
 * Endpoint réservé aux administrateurs pour récupérer l'activité hebdomadaire de l'équipe.
 * Requêtes ciblées par plage temporelle pour une vitesse d'exécution maximale.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé : privilèges administrateur requis" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawOffset = searchParams.get("weekOffset");
    const weekOffset = rawOffset !== null ? parseInt(rawOffset, 10) || 0 : 0;

    const weekRange = getWeekDateRange(new Date(), weekOffset);

    // Requêtes parallèles hautement ciblées sur la semaine demandée
    const [allUsers, activityLogs, weeklyTasks, weeklyMeetings] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, avatarUrl: true },
        orderBy: { name: "asc" },
      }),
      prisma.userActivityLog.findMany({
        where: {
          createdAt: {
            gte: weekRange.startOfWeek,
            lte: weekRange.endOfWeek,
          },
        },
        select: {
          id: true,
          userId: true,
          actionType: true,
          createdAt: true,
        },
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { lastUpdate: { gte: weekRange.startOfWeek, lte: weekRange.endOfWeek } },
            { updatedAt: { gte: weekRange.startOfWeek, lte: weekRange.endOfWeek } },
            { createdAt: { gte: weekRange.startOfWeek, lte: weekRange.endOfWeek } },
          ],
        },
        select: {
          id: true,
          createdById: true,
          lastUpdate: true,
          updatedAt: true,
          assignments: { select: { userId: true } },
        },
      }),
      prisma.meeting.findMany({
        where: {
          createdAt: {
            gte: weekRange.startOfWeek,
            lte: weekRange.endOfWeek,
          },
        },
        select: {
          id: true,
          createdById: true,
          createdAt: true,
          attendees: { select: { userId: true } },
        },
      }),
    ]);

    // Adaptation des formats pour le module métier pur
    const adaptedTasks = weeklyTasks.map((t) => ({
      id: t.id,
      createdById: t.createdById,
      lastUpdate: t.lastUpdate || t.updatedAt,
      assignments: t.assignments.map((a) => a.userId),
    }));

    const adaptedMeetings = weeklyMeetings.map((m) => ({
      id: m.id,
      createdById: m.createdById,
      createdAt: m.createdAt,
      attendees: m.attendees.map((a) => a.userId),
    }));

    const membersActivity = calculateMemberWeeklyActivity(
      allUsers,
      activityLogs,
      adaptedTasks,
      adaptedMeetings,
      weekRange
    );

    const summary = calculateActivitySummary(membersActivity);

    return NextResponse.json(
      {
        weekRange,
        members: membersActivity,
        summary,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[api/admin/activity] Erreur serveur :", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul des activités" },
      { status: 500 }
    );
  }
}
