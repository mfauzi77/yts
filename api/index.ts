import express from "express";
import cors from "cors";
import path from "path";
import ytdl from "@distube/ytdl-core";

const app = express();

console.log(`API Function Initializing... Node: ${process.version}`);

app.use(cors());
app.use(express.json());

// YouTube API Proxy
const API_KEYS = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2
].filter(Boolean) as string[];

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    vercel: !!process.env.VERCEL,
    node: process.version,
    env: process.env.NODE_ENV,
    keys: API_KEYS.length
  });
});

// Use app.use for more flexible path matching
app.use("/api/youtube", async (req, res) => {
  try {
    console.log(`YouTube Proxy Request: ${req.method} ${req.originalUrl}`);
    
    // Extract endpoint from path (e.g., /search or search)
    // When mounted at /api/youtube, req.path is the part after that.
    const endpoint = req.path.replace(/^\//, '').replace(/\/$/, '');
    
    if (!endpoint) {
      return res.status(400).json({ error: { message: "Missing YouTube API endpoint" } });
    }

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
          console.error(`YouTube API returned non-JSON response for ${endpoint}:`, text.substring(0, 100));
          return { error: { message: `YouTube API returned non-JSON response: ${text.substring(0, 100)}` }, status: response.status };
        }

        if (response.ok) {
          return { data, status: 200 };
        }

        // Handle quota exhaustion or invalid key
        const errorMessage = data?.error?.message || "";
        if (response.status === 403 || (response.status === 400 && errorMessage.includes('API key not valid'))) {
          console.warn(`API Key ${keyIndex + 1} failed for ${endpoint}: ${errorMessage}. Trying next...`);
          return fetchFromYouTube(keyIndex + 1);
        }

        return { data, status: response.status };
      } catch (error) {
        console.error(`Proxy fetch error for ${endpoint}:`, error);
        return { error: { message: "Internal Server Error during YouTube fetch" }, status: 500 };
      }
    };

    const result = await fetchFromYouTube(0);
    res.status(result.status).json(result.data || result.error);
  } catch (error) {
    console.error("Unhandled error in /api/youtube:", error);
    res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// Audio Stream Endpoint — proxy YouTube audio to bypass CORS
app.get("/api/audio/:videoId", async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !ytdl.validateID(videoId)) {
    return res.status(400).json({ error: { message: "Video ID tidak valid." } });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    // Pilih format audio-only terbaik
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    if (!format) {
      return res.status(404).json({ error: { message: "Tidak ada format audio yang tersedia untuk video ini." } });
    }

    const title = info.videoDetails.title.replace(/[^\w\s-]/g, "").trim();
    const contentLength = format.contentLength ? parseInt(format.contentLength) : undefined;

    res.setHeader("Content-Type", format.mimeType?.split(";")[0] || "audio/webm");
    res.setHeader("Content-Disposition", `attachment; filename="${title}.webm"`);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength.toString());
    }
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-store");

    // Stream audio langsung ke client
    ytdl(url, { format }).pipe(res);
  } catch (error: any) {
    console.error(`[audio endpoint] Error for ${videoId}:`, error?.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: { message: "Gagal mengambil audio dari YouTube." } });
    }
  }
});

// Catch-all for undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ 
    error: { 
      message: `API Route not found: ${req.originalUrl}`,
      path: req.path
    } 
  });
});

// Global Error Handler to ensure JSON response
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Error Handler:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    }
  });
});

export default app;
