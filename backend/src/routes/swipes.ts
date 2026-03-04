import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const swipeRoutes = new Hono<{ Variables: Variables }>();

// Create a swipe
swipeRoutes.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const { swipedId, direction } = await c.req.json();

  const swipe = await prisma.swipe.create({
    data: {
      swiperId: user.id,
      swipedId,
      direction,
    },
  });

  // Check for mutual match
  let isMatch = false;
  if (direction === "right") {
    const mutual = await prisma.swipe.findFirst({
      where: {
        swiperId: swipedId,
        swipedId: user.id,
        direction: "right",
      },
    });
    isMatch = !!mutual;
  }

  return c.json({ data: { swipe, isMatch } });
});
