import express from "express";
import { spawn } from "child_process";
const router = express.Router();

router.get("/", async (req, res) => {
    const { videoUrl } = req.query;
    if (!videoUrl) return res.status(400).json({ error: "Missing videoUrl" });

    try {
        const fixedUrl = videoUrl.includes("/shorts/")
            ? videoUrl.replace("/shorts/", "/watch?v=")
            : videoUrl;

        const ytdlpPath = "./yt-dlp";
        const ytdlp = spawn(ytdlpPath, ["--no-playlist", "--dump-json", fixedUrl]);

        let output = "";
        let errorOutput = "";

        ytdlp.stdout.on("data", (data) => {
            output += data.toString();
        });
        ytdlp.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        ytdlp.on("close", (code) => {
            if (code !== 0) {
                console.error("yt-dlp error:", errorOutput);
                return res.status(500).json({ error: "Failed to fetch info" });
            }

            try {
                const info = JSON.parse(output);
                const audioFormats = (info.formats || []).filter(
                    (f) => f.vcodec === "none" && f.acodec !== "none"
                );

                const response = {};

                for (const type of ["m4a", "mp3"]) {
                    const match =
                        audioFormats.find((f) => f.ext === type) ||
                        audioFormats.find((f) => f.acodec?.includes?.("mp4a"));

                    let estimatedSize = null;
                    if (match?.abr && info.duration) {
                        // abr is kbps -> bytes = (kbps * 1000 * seconds) / 8
                        estimatedSize = Math.round((match.abr * 1000 * info.duration) / 8);
                    }

                    response[type] = {
                        ext: type,
                        abr: match?.abr || "128",
                        filesize: estimatedSize,
                        filesizeReadable: estimatedSize
                            ? `${(estimatedSize / (1024 * 1024)).toFixed(2)} MB`
                            : "N/A",
                    };
                }

                res.status(200).json(response);
            } catch (err) {
                console.error("Parse error:", err);
                res.status(500).json({ error: "Failed to parse metadata" });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Unexpected error" });
    }
});

export default router;
