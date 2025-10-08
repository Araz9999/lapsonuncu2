import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import authRoutes from "./routes/auth";
import paymentRoutes from "./routes/payments";

const app = new Hono();

app.use("*", cors({
  origin: (origin) => origin,
  credentials: true,
}));

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.route("/auth", authRoutes);
app.route("/api/payments", paymentRoutes);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
