import express from "express";
import cors from "cors";
import path from "path";

const app = express();

async function startServer() {
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // YouTube API Proxy
  const API_KEYS = [
    process.env.YOUTUBE_API_KEY_1,
    process.env.YOUTUBE_API_KEY_2
  ].filter(Boolean) as string[];

  let currentApiKeyIndex = 0;

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", vercel: !!process.env.VERCEL });
  });

  app.get("/api/youtube/:endpoint", async (req, res) => {
    const { endpoint } = req.params;
    const queryParams = new URLSearchParams(req.query as any);
    
    if (API_KEYS.length === 0) {
      return res.status(500).json({ 
        error: { 
          message: "YouTube API Keys are not configured in environment variables (YOUTUBE_API_KEY_1, YOUTUBE_API_KEY_2)." 
        } 
      });
    }

    const fetchFromYouTube = async (keyIndex: number): Promise<any> => {
      if (keyIndex >= API_KEYS.length) {
        return { error: { message: "Semua kunci API telah melebihi kuota harian." }, status: 403 };
      }

      const apiKey = API_KEYS[keyIndex];
      queryParams.set("key", apiKey);
      
      const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${queryParams.toString()}`;
      
      try {
        const response = await fetch(url);
        const contentType = response.headers.get("content-type");
        
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          return { error: { message: `YouTube API returned non-JSON response: ${text.substring(0, 100)}` }, status: response.status };
        }

        if (response.ok) {
          return { data, status: 200 };
        }

        // Handle quota exhaustion or invalid key
        const errorMessage = data?.error?.message || "";
        if (response.status === 403 || (response.status === 400 && errorMessage.includes('API key not valid'))) {
          console.warn(`API Key ${keyIndex + 1} failed: ${errorMessage}. Trying next...`);
          currentApiKeyIndex = keyIndex + 1;
          return fetchFromYouTube(currentApiKeyIndex);
        }

        return { data, status: response.status };
      } catch (error) {
        console.error("Proxy fetch error:", error);
        return { error: { message: "Internal Server Error during YouTube fetch" }, status: 500 };
      }
    };

    const result = await fetchFromYouTube(currentApiKeyIndex);
    res.status(result.status).json(result.data || result.error);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
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

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
