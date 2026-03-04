import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./env";
import { auth } from "./auth";
import { profileRoutes } from "./routes/profiles";
import { swipeRoutes } from "./routes/swipes";
import { matchRoutes } from "./routes/matches";
import { messageRoutes } from "./routes/messages";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

app.use("*", cors({
  origin: (origin) => origin ?? "*",
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

app.use("*", logger());

// Auth middleware
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// API routes
app.route("/api/profiles", profileRoutes);
app.route("/api/swipes", swipeRoutes);
app.route("/api/matches", matchRoutes);
app.route("/api/messages", messageRoutes);

export default {
  port: parseInt(env.PORT || "3000"),
  fetch: app.fetch,
};
