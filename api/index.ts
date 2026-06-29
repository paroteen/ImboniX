/**
 * Vercel serverless entrypoint. Routes /api/* to the shared Express app.
 * The vercel.json route maps every /api request here while preserving the
 * original URL, so the app's own /api/* handlers match as usual.
 */
import app from "../src/server/app";

export default app;
