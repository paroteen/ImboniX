/**
 * Vercel serverless entrypoint. Routes /api/* to the shared Express app.
 * The vercel.json route maps every /api request here while preserving the
 * original URL, so the app's own /api/* handlers match as usual.
 */
// Explicit .js extension: Vercel runs this as unbundled Node ESM ("type": "module"),
// which cannot resolve extensionless relative imports.
import app from "../src/server/app.js";

export default app;
