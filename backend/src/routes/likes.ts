import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const likesRoutes = new Hono<{ Variables: Variables }>();

const REVEAL_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

// GET /api/likes - get profiles that liked me
// isPremium query param: "true" | "false"
// For non-premium: returns blurred list + 1 revealed profile per 48h
// For premium: returns full unblurred list
likesRoutes.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const isPremium = c.req.query("isPremium") === "true";

  // Get all users who swiped right on me (and I haven't matched with already... but show all for now)
  const rightSwipesOnMe = await prisma.swipe.findMany({
    where: { swipedId: user.id, direction: "right" },
    orderBy: { createdAt: "desc" },
    include: {
      swiper: {
        include: {
          profile: {
            include: {
              photos: { orderBy: { position: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (isPremium) {
    // Premium: return full unblurred list
    const profiles = rightSwipesOnMe
      .filter((s) => s.swiper.profile)
      .map((s) => ({
        userId: s.swiper.id,
        displayName: s.swiper.profile!.displayName,
        age: s.swiper.profile!.age,
        crewmateColor: s.swiper.profile!.crewmateColor,
        photoUrl: s.swiper.profile!.photos[0]?.url ?? null,
        likedAt: s.createdAt.toISOString(),
        isRevealed: true,
        isBlurred: false,
      }));
    return c.json({ data: { profiles, canRevealMore: false, nextRevealAt: null } });
  }

  // Non-premium: get my existing reveals
  const myReveals = await prisma.likeReveal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const revealedIds = new Set(myReveals.map((r) => r.revealedId));

  // Check if can reveal: only 1 reveal per 48h
  const recentReveal = myReveals[0];
  const canReveal = !recentReveal || (Date.now() - recentReveal.createdAt.getTime()) >= REVEAL_WINDOW_MS;
  const nextRevealAt = recentReveal && !canReveal
    ? new Date(recentReveal.createdAt.getTime() + REVEAL_WINDOW_MS).toISOString()
    : null;

  const profiles = rightSwipesOnMe
    .filter((s) => s.swiper.profile)
    .map((s) => {
      const isRevealed = revealedIds.has(s.swiper.id);
      return {
        userId: s.swiper.id,
        displayName: isRevealed ? s.swiper.profile!.displayName : "???",
        age: isRevealed ? s.swiper.profile!.age : null,
        crewmateColor: isRevealed ? s.swiper.profile!.crewmateColor : "gray",
        photoUrl: isRevealed ? (s.swiper.profile!.photos[0]?.url ?? null) : null,
        likedAt: s.createdAt.toISOString(),
        isRevealed,
        isBlurred: !isRevealed,
      };
    });

  return c.json({ data: { profiles, canReveal, nextRevealAt } });
});

// POST /api/likes/reveal/:userId - reveal a specific profile (non-premium only)
likesRoutes.post("/reveal/:userId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { userId: targetUserId } = c.req.param();

  // Check 48h cooldown
  const recentReveal = await prisma.likeReveal.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (recentReveal && (Date.now() - recentReveal.createdAt.getTime()) < REVEAL_WINDOW_MS) {
    const nextRevealAt = new Date(recentReveal.createdAt.getTime() + REVEAL_WINDOW_MS).toISOString();
    return c.json({ error: { message: "Reveal cooldown active", code: "REVEAL_COOLDOWN", nextRevealAt } }, 429);
  }

  // Verify this person actually liked me
  const swipe = await prisma.swipe.findFirst({
    where: { swiperId: targetUserId, swipedId: user.id, direction: "right" },
  });
  if (!swipe) return c.json({ error: { message: "This person hasn't liked you" } }, 404);

  // Create reveal
  await prisma.likeReveal.upsert({
    where: { userId_revealedId: { userId: user.id, revealedId: targetUserId } },
    create: { userId: user.id, revealedId: targetUserId },
    update: {},
  });

  // Fetch the revealed profile
  const profile = await prisma.profile.findUnique({
    where: { userId: targetUserId },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });

  return c.json({
    data: {
      userId: targetUserId,
      displayName: profile?.displayName ?? "Unknown",
      age: profile?.age ?? null,
      crewmateColor: profile?.crewmateColor ?? "red",
      photoUrl: profile?.photos[0]?.url ?? null,
      isRevealed: true,
      isBlurred: false,
    },
  });
});
