/**
 * Module de calcul des métriques d'activité hebdomadaire pour l'espace administrateur.
 * Assure le découpage temporel ISO par semaine, l'agrégation visites + actions,
 * et le tri strict du membre le plus connecté (gauche) au moins connecté (droite).
 */

export interface RawUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface RawActivityLog {
  id: string;
  userId: string;
  actionType: string;
  createdAt: Date;
}

export interface RawTaskActivity {
  id: string;
  createdById: string | null;
  lastUpdate?: Date | null;
  assignments?: string[];
}

export interface RawMeetingActivity {
  id: string;
  createdById: string | null;
  createdAt: Date;
  attendees?: string[];
}

export interface WeekDateRange {
  startOfWeek: Date;
  endOfWeek: Date;
  weekNumber: number;
  year: number;
  formattedLabel: string;
}

export interface MemberActivityData {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  visitsCount: number;
  actionsCount: number;
  totalActivity: number;
  lastActiveDate: Date | null;
  status: "ACTIVE" | "MODERATE" | "INACTIVE";
}

export interface ActivitySummaryMetrics {
  mostActiveMember: MemberActivityData | null;
  leastActiveMember: MemberActivityData | null;
  averageActivity: number;
  inactiveMembersCount: number;
  totalWeeklyInteractions: number;
}

/**
 * Calcule les bornes exactes de la semaine (du Lundi 00:00:00.000 au Dimanche 23:59:59.999).
 * Accepte un décalage de semaine (weekOffset: 0 pour courante, -1 pour précédente, etc.).
 */
export function getWeekDateRange(refDate: Date = new Date(), weekOffset: number = 0): WeekDateRange {
  const targetDate = new Date(refDate.getTime());
  targetDate.setUTCDate(targetDate.getUTCDate() + weekOffset * 7);

  // Jour de la semaine en UTC (0 = Dimanche, 1 = Lundi, etc.)
  const day = targetDate.getUTCDay();
  // Décalage pour atteindre le Lundi (1)
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(targetDate.getTime());
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() + diffToMonday);
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek.getTime());
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);

  // Calcul du numéro de semaine ISO
  const thursday = new Date(startOfWeek.getTime());
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  const firstThursdayOfYear = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const weekNumber = Math.ceil(
    ((thursday.getTime() - firstThursdayOfYear.getTime()) / 86400000 + 1) / 7
  );

  const startDay = startOfWeek.getUTCDate();
  const endDay = endOfWeek.getUTCDate();
  const startMonthStr = startOfWeek.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" });
  const endMonthStr = endOfWeek.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" });
  const year = endOfWeek.getUTCFullYear();

  const formattedLabel = `Semaine ${weekNumber} (${startDay} ${startMonthStr} – ${endDay} ${endMonthStr} ${year})`;

  return {
    startOfWeek,
    endOfWeek,
    weekNumber,
    year,
    formattedLabel,
  };
}

/**
 * Agrège les visites et actions pour chaque membre et les trie du plus actif au moins actif.
 */
export function calculateMemberWeeklyActivity(
  users: RawUser[],
  activityLogs: RawActivityLog[],
  tasks: RawTaskActivity[],
  meetings: RawMeetingActivity[],
  weekRange: WeekDateRange
): MemberActivityData[] {
  const { startOfWeek, endOfWeek } = weekRange;
  const startTime = startOfWeek.getTime();
  const endTime = endOfWeek.getTime();

  const memberMap = new Map<string, {
    visitsCount: number;
    actionsCount: number;
    lastActiveDate: Date | null;
  }>();

  for (const user of users) {
    memberMap.set(user.id, {
      visitsCount: 0,
      actionsCount: 0,
      lastActiveDate: null,
    });
  }

  // 1. Comptabilisation des logs de visites et activités explicites
  for (const log of activityLogs) {
    const logTime = new Date(log.createdAt).getTime();
    if (logTime >= startTime && logTime <= endTime) {
      const stats = memberMap.get(log.userId);
      if (stats) {
        if (log.actionType === "VISIT") {
          stats.visitsCount += 1;
        } else {
          stats.actionsCount += 1;
        }
        if (!stats.lastActiveDate || logTime > stats.lastActiveDate.getTime()) {
          stats.lastActiveDate = new Date(log.createdAt);
        }
      }
    }
  }

  // 2. Comptabilisation des tâches (créateur ou mise à jour dans la semaine)
  for (const task of tasks) {
    if (task.lastUpdate) {
      const updateTime = new Date(task.lastUpdate).getTime();
      if (updateTime >= startTime && updateTime <= endTime) {
        if (task.createdById && memberMap.has(task.createdById)) {
          const stats = memberMap.get(task.createdById)!;
          stats.actionsCount += 1;
          if (!stats.lastActiveDate || updateTime > stats.lastActiveDate.getTime()) {
            stats.lastActiveDate = new Date(task.lastUpdate);
          }
        }
      }
    }
  }

  // 3. Comptabilisation des réunions dans la semaine
  for (const meeting of meetings) {
    const meetingTime = new Date(meeting.createdAt).getTime();
    if (meetingTime >= startTime && meetingTime <= endTime) {
      if (meeting.createdById && memberMap.has(meeting.createdById)) {
        const stats = memberMap.get(meeting.createdById)!;
        stats.actionsCount += 1;
        if (!stats.lastActiveDate || meetingTime > stats.lastActiveDate.getTime()) {
          stats.lastActiveDate = new Date(meeting.createdAt);
        }
      }
      if (meeting.attendees) {
        for (const attendeeId of meeting.attendees) {
          if (attendeeId !== meeting.createdById && memberMap.has(attendeeId)) {
            const stats = memberMap.get(attendeeId)!;
            stats.actionsCount += 1;
            if (!stats.lastActiveDate || meetingTime > stats.lastActiveDate.getTime()) {
              stats.lastActiveDate = new Date(meeting.createdAt);
            }
          }
        }
      }
    }
  }

  // Construction du tableau final
  const result: MemberActivityData[] = users.map((user) => {
    const stats = memberMap.get(user.id)!;
    const totalActivity = stats.visitsCount + stats.actionsCount;
    let status: "ACTIVE" | "MODERATE" | "INACTIVE" = "ACTIVE";
    if (totalActivity === 0) {
      status = "INACTIVE";
    } else if (totalActivity <= 2) {
      status = "MODERATE";
    }

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      visitsCount: stats.visitsCount,
      actionsCount: stats.actionsCount,
      totalActivity,
      lastActiveDate: stats.lastActiveDate,
      status,
    };
  });

  // Tri décroissant : le plus connecté / actif à gauche (index 0) au moins connecté à droite
  result.sort((a, b) => {
    if (b.totalActivity !== a.totalActivity) {
      return b.totalActivity - a.totalActivity;
    }
    // En cas d'égalité, tri alphabétique par nom
    return a.name.localeCompare(b.name, "fr");
  });

  return result;
}

/**
 * Calcule les indicateurs clés (KPI) de synthèse de l'équipe pour la semaine sélectionnée.
 */
export function calculateActivitySummary(memberActivities: MemberActivityData[]): ActivitySummaryMetrics {
  if (memberActivities.length === 0) {
    return {
      mostActiveMember: null,
      leastActiveMember: null,
      averageActivity: 0,
      inactiveMembersCount: 0,
      totalWeeklyInteractions: 0,
    };
  }

  const totalWeeklyInteractions = memberActivities.reduce((acc, curr) => acc + curr.totalActivity, 0);
  const averageActivity = Math.round((totalWeeklyInteractions / memberActivities.length) * 10) / 10;
  const inactiveMembersCount = memberActivities.filter((m) => m.totalActivity === 0).length;

  return {
    mostActiveMember: memberActivities[0],
    leastActiveMember: memberActivities[memberActivities.length - 1],
    averageActivity,
    inactiveMembersCount,
    totalWeeklyInteractions,
  };
}
