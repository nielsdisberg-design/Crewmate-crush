import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const profileRoutes = new Hono<{ Variables: Variables }>();

// Get my profile
profileRoutes.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return c.json({ data: profile });
});

// Create or update profile
profileRoutes.post("/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const body = await c.req.json();

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: body.displayName,
      bio: body.bio || "",
      age: body.age,
      gender: body.gender,
      lookingFor: body.lookingFor,
      crewmateColor: body.crewmateColor || "red",
      favoriteRole: body.favoriteRole || "crewmate",
      favoriteMap: body.favoriteMap || "the-skeld",
      playStyle: body.playStyle || "detective",
      susLevel: body.susLevel ?? 5,
      gamesPlayed: body.gamesPlayed || "100+",
      photoUrl: body.photoUrl,
      isComplete: true,
    },
    update: {
      displayName: body.displayName,
      bio: body.bio,
      age: body.age,
      gender: body.gender,
      lookingFor: body.lookingFor,
      crewmateColor: body.crewmateColor,
      favoriteRole: body.favoriteRole,
      favoriteMap: body.favoriteMap,
      playStyle: body.playStyle,
      susLevel: body.susLevel,
      gamesPlayed: body.gamesPlayed,
      photoUrl: body.photoUrl,
      isComplete: true,
    },
  });

  return c.json({ data: profile });
});

// Get discovery profiles (profiles to swipe on)
profileRoutes.get("/discover", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  // Get IDs already swiped on
  const swipedIds = await prisma.swipe.findMany({
    where: { swiperId: user.id },
    select: { swipedId: true },
  });
  const excludeIds = [user.id, ...swipedIds.map((s) => s.swipedId)];

  const profiles = await prisma.profile.findMany({
    where: {
      userId: { notIn: excludeIds },
      isComplete: true,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: profiles });
});
