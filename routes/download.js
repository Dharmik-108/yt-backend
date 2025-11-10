import express from "express";
import { YtDlp } from "ytdlp-nodejs";
import { withRateLimit } from "../lib/withRateLimit.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { videoId, formatId } = req.query;
    if (!videoId || !formatId) {
        return res.status(400).json({ error: "Missing videoId or formatId" });
    }

    const url = videoId.startsWith("http")
        ? videoId
        : `https://www.youtube.com/watch?v=${videoId}`;

    try {
        // helper: fetch formats and normalize
        async function getFormatsForVideo(u) {
            const ytdlp = new YtDlp({ args: ["--prefer-free-formats"] });
            const info = await ytdlp.getInfoAsync(u);
            const formatsRaw = (info.formats || [])
                .filter((f) => f.ext === "mp4" && f.vcodec !== "none")
                .map((f) => ({
                    id: String(f.format_id),
                    idNum: Number(f.format_id) || null,
                    quality: f.format_note || (f.height ? `${f.height}p` : "unknown"),
                    _raw: f,
                }));
            return formatsRaw;
        }

        const formats = await getFormatsForVideo(url);

        const parseNumber = (s) => {
            const n = Number(s);
            return Number.isFinite(n) ? n : null;
        };

        const requestedNum = parseNumber(formatId);
        let finalFormatId = String(formatId);

        if (requestedNum !== null && requestedNum >= 400) {
            const byQuality = formats.reduce((acc, f) => {
                acc[f.quality] = acc[f.quality] || [];
                acc[f.quality].push(f);
                return acc;
            }, {});

            const requestedFormat = formats.find((f) => f.id === String(formatId));
            let candidate = null;

            if (requestedFormat) {
                const group = byQuality[requestedFormat.quality] || [];
                candidate = group
                    .filter((x) => Number.isFinite(x.idNum) && x.idNum < 400)
                    .sort((a, b) => b.idNum - a.idNum)[0];
            }

            if (!candidate) {
                candidate = formats
                    .filter((x) => Number.isFinite(x.idNum) && x.idNum < 400)
                    .sort((a, b) => b.idNum - a.idNum)[0];
            }

            if (candidate) finalFormatId = candidate.id;
        }

        const ytdlp = new YtDlp({ args: ["--prefer-free-formats"] });
        res.setHeader("Content-Disposition", `attachment; filename="${videoId}.mp4"`);
        res.setHeader("Content-Type", "video/mp4");

        const stream = ytdlp.stream(url, { format: `${finalFormatId}+bestaudio` });

        // pipeAsync may be provided by ytdlp-nodejs; wrap in promise
        if (typeof stream.pipeAsync === "function") {
            await stream.pipeAsync(res);
        } else {
            stream.pipe(res);
            await new Promise((resolve, reject) => {
                stream.on("end", resolve);
                stream.on("close", resolve);
                stream.on("error", reject);
            });
        }
    } catch (err) {
        console.error("download error", err);
        // if headers already sent, just destroy
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to download video" });
        } else {
            try { res.end(); } catch (e) { }
        }
    }
});

export default withRateLimit(router);
