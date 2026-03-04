import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const messageRoutes = new Hono<{ Variables: Variables }>();

// Get messages with a user
messageRoutes.get("/:userId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const otherUserId = c.req.param("userId");

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return c.json({ data: messages });
});

// Send a message
messageRoutes.post("/:userId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const receiverId = c.req.param("userId");
  const { text } = await c.req.json();

  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      receiverId,
      text,
    },
  });

  return c.json({ data: message });
});
