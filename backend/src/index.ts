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
import { likesRoutes } from "./routes/likes";

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

// Upload endpoint
app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const storageForm = new FormData();
  storageForm.append("file", file);

  const response = await fetch("https://storage.vibecodeapp.com/v1/files/upload", {
    method: "POST",
    body: storageForm,
  });

  if (!response.ok) {
    const error = await response.json();
    return c.json({ error: (error as any).error || "Upload failed" }, 500);
  }

  const result = await response.json() as any;
  return c.json({ data: result.file });
});

// Delete file endpoint
app.delete("/api/files/:id", async (c) => {
  const { id } = c.req.param();
  const response = await fetch(`https://storage.vibecodeapp.com/v1/files/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    return c.json({ error: "Delete failed" }, 500);
  }
  return c.json({ data: { success: true } });
});

// API routes
app.route("/api/profiles", profileRoutes);
app.route("/api/swipes", swipeRoutes);
app.route("/api/matches", matchRoutes);
app.route("/api/messages", messageRoutes);
app.route("/api/likes", likesRoutes);

export default {
  port: parseInt(env.PORT || "3000"),
  fetch: app.fetch,
};
