import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const swipeRoutes = new Hono<{ Variables: Variables }>();

const FREE_DAILY_LIKES = 10;
const LIKE_WINDOW_MS = 24 * 60 * 60 * 1000;

// Get swipe status (likes used today)
swipeRoutes.get("/status", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const windowStart = new Date(Date.now() - LIKE_WINDOW_MS);
  const likesUsed = await prisma.swipe.count({
    where: {
      swiperId: user.id,
      direction: "right",
      createdAt: { gte: windowStart },
    },
  });

  // Find oldest swipe in window to calculate reset time
  const oldestSwipe = await prisma.swipe.findFirst({
    where: {
      swiperId: user.id,
      direction: "right",
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "asc" },
  });

  const resetsAt = oldestSwipe
    ? new Date(oldestSwipe.createdAt.getTime() + LIKE_WINDOW_MS).toISOString()
    : null;

  return c.json({
    data: {
      likesUsed,
      likesRemaining: Math.max(0, FREE_DAILY_LIKES - likesUsed),
      limit: FREE_DAILY_LIKES,
      resetsAt,
    },
  });
});

// Create a swipe
swipeRoutes.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const body = await c.req.json() as { swipedId: string; direction: string; isPremium?: boolean };
  const { swipedId, direction } = body;
  const isPremium = body.isPremium === true;

  // Enforce like limit for non-premium users
  if (direction === "right" && !isPremium) {
    const windowStart = new Date(Date.now() - LIKE_WINDOW_MS);
    const likesUsed = await prisma.swipe.count({
      where: {
        swiperId: user.id,
        direction: "right",
        createdAt: { gte: windowStart },
      },
    });

    if (likesUsed >= FREE_DAILY_LIKES) {
      const oldestSwipe = await prisma.swipe.findFirst({
        where: {
          swiperId: user.id,
          direction: "right",
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: "asc" },
      });
      const resetsAt = oldestSwipe
        ? new Date(oldestSwipe.createdAt.getTime() + LIKE_WINDOW_MS).toISOString()
        : new Date(Date.now() + LIKE_WINDOW_MS).toISOString();

      return c.json(
        { error: { message: "Daily like limit reached", code: "SWIPE_LIMIT_REACHED", resetsAt } },
        429
      );
    }
  }

  // Upsert swipe (in case of duplicate)
  const swipe = await prisma.swipe.upsert({
    where: { swiperId_swipedId: { swiperId: user.id, swipedId } },
    create: { swiperId: user.id, swipedId, direction },
    update: { direction },
  });

  // Check for mutual match
  let isMatch = false;
  if (direction === "right") {
    const mutual = await prisma.swipe.findFirst({
      where: { swiperId: swipedId, swipedId: user.id, direction: "right" },
    });
    isMatch = !!mutual;
  }

  // Return updated like count
  const windowStart = new Date(Date.now() - LIKE_WINDOW_MS);
  const likesUsed = isPremium ? null : await prisma.swipe.count({
    where: { swiperId: user.id, direction: "right", createdAt: { gte: windowStart } },
  });

  return c.json({
    data: {
      swipe,
      isMatch,
      likesUsed,
      likesRemaining: isPremium ? null : Math.max(0, FREE_DAILY_LIKES - (likesUsed ?? 0)),
    },
  });
});
