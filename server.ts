/**
 * ImboniX local dev server. Serves the Vite SPA (middleware mode in dev,
 * static dist in prod) on top of the shared Express API app. On Vercel the
 * same API app is served by api/index.ts as a serverless function instead.
 */
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./src/server/app";

const PORT = 3000;

const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ImboniX Server running at http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
