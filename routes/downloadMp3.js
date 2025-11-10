import express from "express";
import { spawn } from "child_process";
import { withRateLimit } from "../lib/withRateLimit.js";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { videoUrl, type } = req.query;

        if (!videoUrl) return res.status(400).json({ error: "Missing videoUrl" });
        if (!type) return res.status(400).json({ error: "Missing type" });

        let fixedUrl = videoUrl;
        if (fixedUrl.includes("/shorts/")) {
            fixedUrl = fixedUrl.replace("/shorts/", "/watch?v=");
        }

        const audioType = type.toLowerCase();
        const mimeType = audioType === "m4a" ? "audio/mp4" : "audio/mpeg";

        res.setHeader("Content-Disposition", `attachment; filename="audio.${audioType}"`);
        res.setHeader("Content-Type", mimeType);
        const ytdlpPath = "./yt-dlp";
        const ytdlp = spawn(ytdlpPath, [
            "-f", "bestaudio",
            "--no-playlist",
            "-x",
            "--audio-format", audioType,
            "--audio-quality", "0",
            "-o", "-",
            fixedUrl,
        ], { stdio: ["ignore", "pipe", "pipe"] });

        ytdlp.stdout.pipe(res);

        ytdlp.stderr.on("data", (data) => {
            console.error("[yt-dlp error]:", data.toString());
        });

        ytdlp.on("close", (code) => {
            if (code !== 0) {
                console.error(`yt-dlp exited with code ${code}`);
                if (!res.headersSent) {
                    return res.status(500).end("yt-dlp process failed");
                }
            } else {
                try { res.end(); } catch (e) { }
            }
        });
    } catch (err) {
        console.error("Handler error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        } else {
            try { res.end(); } catch (e) { }
        }
    }
});

export default withRateLimit(router);
