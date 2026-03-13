import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // YouTube API Proxy
  const API_KEYS = [
    process.env.YOUTUBE_API_KEY_1,
    process.env.YOUTUBE_API_KEY_2
  ].filter(Boolean) as string[];

  const APP_PIN = process.env.APP_PIN;

  let currentApiKeyIndex = 0;

  // Middleware to verify PIN
  const verifyPin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pin = req.headers["x-app-pin"];
    
    if (!APP_PIN) {
      // If no PIN is configured, allow all requests (for development/initial setup)
      return next();
    }

    if (pin === APP_PIN) {
      return next();
    }

    res.status(401).json({ error: "Unauthorized: Invalid PIN" });
  };

  app.post("/api/verify-pin", verifyPin, (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/youtube/:endpoint", verifyPin, async (req, res) => {
    const { endpoint } = req.params;
    const queryParams = new URLSearchParams(req.query as any);
    
    const fetchFromYouTube = async (keyIndex: number): Promise<any> => {
      if (keyIndex >= API_KEYS.length) {
        return { error: "All API keys exhausted", status: 403 };
      }

      const apiKey = API_KEYS[keyIndex];
      queryParams.set("key", apiKey);
      
      const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${queryParams.toString()}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
          return { data, status: 200 };
        }

        // Handle quota exhaustion or invalid key
        if (response.status === 403 || (response.status === 400 && data?.error?.message?.includes('API key not valid'))) {
          console.warn(`API Key ${keyIndex + 1} failed. Trying next...`);
          currentApiKeyIndex = keyIndex + 1;
          return fetchFromYouTube(currentApiKeyIndex);
        }

        return { data, status: response.status };
      } catch (error) {
        return { error: "Internal Server Error", status: 500 };
      }
    };

    const result = await fetchFromYouTube(currentApiKeyIndex);
    res.status(result.status).json(result.data || { error: result.error });
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
