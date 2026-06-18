import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerRestaurantAuthRoutes, registerEmailLoginRoute } from "../auth-routes";
import { adminLoginRouter } from "../admin-login-route";
import { configureSessionMiddleware } from "../session-middleware";

import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Export app for testing
export let app: Express;

async function startServer() {
  app = express();
  const server = createServer(app);
  
  // Trust proxy to correctly detect HTTPS behind reverse proxy (Manus infrastructure)
  // This allows secure cookies to work properly in production
  app.set('trust proxy', 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // IMPORTANT: Configure session middleware GLOBALLY before any routes
  // This allows tRPC routes to access Passport.js session
  configureSessionMiddleware(app);
  
  // Storage proxy for /manus-storage/* paths
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback (Manus OAuth)
  registerOAuthRoutes(app);
  // Restaurant owner OAuth routes (Google & Facebook)
  registerRestaurantAuthRoutes(app);
  // Restaurant owner email/password login
  registerEmailLoginRoute(app);
  // Admin login route (classic HTML form POST)
  app.use("/api/admin", adminLoginRouter);
  // Admin authentication is also available via tRPC (see routers/adminAuth.ts)
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
