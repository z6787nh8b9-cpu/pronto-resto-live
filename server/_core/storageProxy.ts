import type { Express } from "express";
import { ENV } from "./env";
export function registerAssetProxy(app: Express) {
  app.get("/assets/*", async (req, res) => {
    const key = (req.params as Record<string, string | undefined>)["0"];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Asset backend not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });
      if (!forgeResp.ok) {
        console.error(`[AssetProxy] upstream error: ${forgeResp.status}`);
        res.status(502).send("Asset backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty asset URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch {
      console.error("[AssetProxy] failed");
      res.status(502).send("Asset proxy error");
    }
  });
}
