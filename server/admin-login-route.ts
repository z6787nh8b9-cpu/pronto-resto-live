import { Router } from "express";
import bcrypt from "bcrypt";
import { getDb } from "./db";
import { adminAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { adminLoginLimiter, requireSameOrigin } from "./rate-limiters";
import { recordSecurityEvent } from "./security-events";

export const adminLoginRouter = Router();

// POST /api/admin/login - Classic form POST with server redirect
// SECURITY: Rate limiter applied (5 attempts max per 15 minutes)
adminLoginRouter.post("/login", requireSameOrigin, adminLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      await recordSecurityEvent({ req, principalType: "admin", eventType: "admin.email_login", outcome: "failure" });
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Erreur de connexion</title>
          <style>
            body { font-family: system-ui; max-width: 500px; margin: 100px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; color: #c00; }
            a { color: #0066cc; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Erreur</h2>
            <p>Tous les champs sont requis.</p>
            <p><a href="/admin/login">← Retour à la connexion</a></p>
          </div>
        </body>
        </html>
      `);
    }

    // Find admin by email
    const db = await getDb();
    if (!db) {
      console.error("[Admin Login Route] Database connection unavailable");
      await recordSecurityEvent({ req, principalType: "system", eventType: "admin.email_login", outcome: "failure" });
      return res.status(500).send("Database error");
    }
    
    const [admin] = await db
      .select()
      .from(adminAccounts)
      .where(eq(adminAccounts.email, email))
      .limit(1);

    if (!admin) {
      await recordSecurityEvent({ req, principalType: "admin", eventType: "admin.email_login", outcome: "failure" });
      return res.status(401).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Erreur de connexion</title>
          <style>
            body { font-family: system-ui; max-width: 500px; margin: 100px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; color: #c00; }
            a { color: #0066cc; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Erreur</h2>
            <p>Email ou mot de passe incorrect.</p>
            <p><a href="/admin/login">← Retour à la connexion</a></p>
          </div>
        </body>
        </html>
      `);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      await recordSecurityEvent({ req, principalType: "admin", principalId: admin.id, eventType: "admin.email_login", outcome: "failure" });
      return res.status(401).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Erreur de connexion</title>
          <style>
            body { font-family: system-ui; max-width: 500px; margin: 100px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; color: #c00; }
            a { color: #0066cc; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Erreur</h2>
            <p>Email ou mot de passe incorrect.</p>
            <p><a href="/admin/login">← Retour à la connexion</a></p>
          </div>
        </body>
        </html>
      `);
    }

    // Rotate session before privilege elevation to prevent session fixation.
    await new Promise<void>((resolve, reject) => req.session.regenerate((err) => err ? reject(err) : resolve()));
    req.session.adminId = admin.id;
    req.session.adminAuthVersion = admin.authVersion;

    // Save session and redirect
    req.session.save((err) => {
      if (err) {
        console.error("[Admin Login Route] Unable to save admin session");
        void recordSecurityEvent({ req, principalType: "admin", principalId: admin.id, eventType: "admin.email_login", outcome: "failure" });
        return res.status(500).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Erreur serveur</title>
            <style>
              body { font-family: system-ui; max-width: 500px; margin: 100px auto; padding: 20px; }
              .error { background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; color: #c00; }
              a { color: #0066cc; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>❌ Erreur</h2>
              <p>Erreur lors de la sauvegarde de la session.</p>
              <p><a href="/admin/login">← Retour à la connexion</a></p>
            </div>
          </body>
          </html>
        `);
      }

      // HTTP 302 redirect to admin panel
      void recordSecurityEvent({ req, principalType: "admin", principalId: admin.id, eventType: "admin.email_login", outcome: "success" });
      res.redirect(302, "/admin");
    });
  } catch {
    console.error("[Admin Login Route] Unexpected authentication failure");
    await recordSecurityEvent({ req, principalType: "system", eventType: "admin.email_login", outcome: "failure" });
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Erreur serveur</title>
        <style>
          body { font-family: system-ui; max-width: 500px; margin: 100px auto; padding: 20px; }
          .error { background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; color: #c00; }
          a { color: #0066cc; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Erreur</h2>
          <p>Une erreur inattendue s'est produite.</p>
          <p><a href="/admin/login">← Retour à la connexion</a></p>
        </div>
      </body>
      </html>
    `);
  }
});
