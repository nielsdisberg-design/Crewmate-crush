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
    include: { photos: { orderBy: { position: "asc" } } },
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
      photos: { orderBy: { position: "asc" }, take: 1 },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: profiles });
});

// Get my photos
profileRoutes.get("/me/photos", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ data: [] });
  const photos = await prisma.profilePhoto.findMany({
    where: { profileId: profile.id },
    orderBy: { position: "asc" },
  });
  return c.json({ data: photos });
});

// Add a photo
profileRoutes.post("/me/photos", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found" } }, 404);
  const body = await c.req.json() as { url: string; fileId: string; position?: number };
  const photo = await prisma.profilePhoto.create({
    data: {
      profileId: profile.id,
      url: body.url,
      fileId: body.fileId,
      position: body.position ?? 0,
    },
  });
  return c.json({ data: photo });
});

// Delete a photo
profileRoutes.delete("/me/photos/:photoId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found" } }, 404);
  const { photoId } = c.req.param();
  const photo = await prisma.profilePhoto.findFirst({
    where: { id: photoId, profileId: profile.id },
  });
  if (!photo) return c.json({ error: { message: "Photo not found" } }, 404);
  await prisma.profilePhoto.delete({ where: { id: photoId } });
  return c.json({ data: { success: true } });
});

// Get photos for another user's profile
profileRoutes.get("/:userId/photos", async (c) => {
  const { userId } = c.req.param();
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return c.json({ data: [] });
  const photos = await prisma.profilePhoto.findMany({
    where: { profileId: profile.id },
    orderBy: { position: "asc" },
  });
  return c.json({ data: photos });
});
