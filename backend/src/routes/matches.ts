import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const matchRoutes = new Hono<{ Variables: Variables }>();

// Get all matches
matchRoutes.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  // Find mutual right swipes
  const myRightSwipes = await prisma.swipe.findMany({
    where: { swiperId: user.id, direction: "right" },
    select: { swipedId: true },
  });
  const myRightSwipeIds = myRightSwipes.map((s) => s.swipedId);

  const mutualSwipes = await prisma.swipe.findMany({
    where: {
      swiperId: { in: myRightSwipeIds },
      swipedId: user.id,
      direction: "right",
    },
    select: { swiperId: true },
  });
  const matchedUserIds = mutualSwipes.map((s) => s.swiperId);

  const matchedProfiles = await prisma.profile.findMany({
    where: { userId: { in: matchedUserIds } },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Get last message for each match
  const matchesWithLastMessage = await Promise.all(
    matchedProfiles.map(async (profile) => {
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: user.id, receiverId: profile.userId },
            { senderId: profile.userId, receiverId: user.id },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      return { ...profile, lastMessage };
    })
  );

  return c.json({ data: matchesWithLastMessage });
});
