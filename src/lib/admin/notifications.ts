import crypto from "crypto";
import prisma from "../prisma";

export interface NotificationItem {
  id: string;
  userOrRole: string; // "role:SUPER_ADMIN", "role:GRAPHIC_DESIGNER", or user ID
  title: string;
  body: string;
  link?: string | null;
  readTime?: string | null;
  createdAt: string;
}

export const NOTIFICATIONS_STORE: NotificationItem[] = [
  {
    id: "notif_seed_welcome",
    userOrRole: "role:SUPER_ADMIN",
    title: "Admin System Initialized",
    body: "Purple Friday Admin Control Room Part 1 is active. Security rules & RBAC ready.",
    link: "/admin/settings",
    readTime: null,
    createdAt: new Date().toISOString(),
  },
];

export async function createNotification(params: {
  userOrRole: string;
  title: string;
  body: string;
  link?: string;
}): Promise<NotificationItem> {
  const now = new Date();
  const id = `notif_${now.getTime()}_${crypto.randomBytes(3).toString("hex")}`;

  const record: NotificationItem = {
    id,
    userOrRole: params.userOrRole,
    title: params.title,
    body: params.body,
    link: params.link || null,
    readTime: null,
    createdAt: now.toISOString(),
  };

  NOTIFICATIONS_STORE.unshift(record);
  if (NOTIFICATIONS_STORE.length > 200) {
    NOTIFICATIONS_STORE.pop();
  }

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.notification.create({
        data: {
          id: record.id,
          userOrRole: record.userOrRole,
          title: record.title,
          body: record.body,
          link: record.link,
          createdAt: now,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  return record;
}

  export async function getNotificationsForUserOrRole(
    identifiers: string[],
    after?: string | null
  ): Promise<NotificationItem[]> {
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
        const rows = await prisma.notification.findMany({
          where: {
            userOrRole: { in: identifiers },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        if (rows.length > 0) {
            const mapped = rows.map((r) => ({
              id: r.id,
              userOrRole: r.userOrRole,
              title: r.title,
              body: r.body,
              link: r.link,
              readTime: r.readTime ? r.readTime.toISOString() : null,
              createdAt: r.createdAt.toISOString(),
            }));

            if(after) {
              const idx = mapped.findIndex((n) => n.id === after);
              if (idx > 0) return mapped.slice(0, idx);
              if (idx === 0) return [];
            }
        return mapped;
          }
    }
      } catch {
        // Fallback to memory
      }

      const all = NOTIFICATIONS_STORE.filter((n) => identifiers.includes(n.userOrRole));
      if (after) {
        const idx = all.findIndex((n) => n.id === after);
        if (idx > 0) return all.slice(0, idx);
        if (idx === 0) return [];
      }
      return all.slice(0, 50);
    }

export async function markNotificationAsRead(id: string): Promise<void> {
      const now = new Date();

      try {
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
          await prisma.notification.update({
            where: { id },
            data: { readTime: now },
          });
        }
      } catch {
        // Memory fallback
      }

      const inMem = NOTIFICATIONS_STORE.find((n) => n.id === id);
      if (inMem) {
        inMem.readTime = now.toISOString();
      }
    }

    export async function markAllNotificationsAsRead(identifiers: string[]): Promise<void> {
      const now = new Date();

      try {
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
          await prisma.notification.updateMany({
            where: {
              userOrRole: { in: identifiers },
              readTime: null,
            },
            data: { readTime: now },
          });
        }
      } catch {
        // Memory fallback
      }

      for (const n of NOTIFICATIONS_STORE) {
        if (identifiers.includes(n.userOrRole) && !n.readTime) {
          n.readTime = now.toISOString();
        }
      }
    }
