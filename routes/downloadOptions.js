import express from "express";
import { YtDlp } from "ytdlp-nodejs";
const router = express.Router();

router.get("/", async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "Missing videoId" });

    try {
        const ytdlp = new YtDlp();
        const url = videoId.startsWith("http")
            ? videoId
            : `https://www.youtube.com/watch?v=${videoId}`;

        const info = await ytdlp.getInfoAsync(url);

        const formatsRaw = (info.formats || [])
            .filter(
                (f) =>
                    f.ext === "mp4" &&
                    f.vcodec !== "none" &&
                    (!f.format_note?.includes("60") && !f.format_note?.includes("fps"))
            )
            .map((f) => {
                const bitrate = f.tbr || f.vbr || f.abr || 0;
                const duration = f.duration || info.duration || 0;
                const contentLength = f.filesize || f.filesize_approx || f.content_length;

                const estimatedFilesize =
                    contentLength ||
                    (bitrate && duration ? (bitrate * 1000 * duration) / 8 : null);

                return {
                    id: String(f.format_id),
                    idNum: Number(f.format_id) || null,
                    quality: f.format_note || (f.height ? `${f.height}p` : "unknown"),
                    ext: f.ext,
                    estimatedFilesize: estimatedFilesize || null,
                    _raw: f,
                };
            });

        const byQuality = {};
        for (const f of formatsRaw) {
            const q = f.quality || "unknown";
            byQuality[q] = byQuality[q] || [];
            byQuality[q].push(f);
        }

        const findLargestBelow400 = (arr) =>
            arr
                .filter((x) => Number.isFinite(x.idNum) && x.idNum < 400)
                .sort((a, b) => b.idNum - a.idNum)[0] || null;

        const globalLargestBelow400 = findLargestBelow400(formatsRaw);

        const formats = formatsRaw.map((f) => {
            let selectedId = f.id;

            if (f.idNum !== null && f.idNum >= 400) {
                const group = byQuality[f.quality] || [];
                const candidate = findLargestBelow400(group);

                if (candidate) {
                    selectedId = candidate.id;
                } else if (globalLargestBelow400) {
                    selectedId = globalLargestBelow400.id;
                } else {
                    selectedId = f.id;
                }
            }

            return {
                id: f.id,
                selectedId,
                quality: f.quality,
                ext: f.ext,
                estimatedFilesize: f.estimatedFilesize,
            };
        });

        res.status(200).json({ formats });
    } catch (err) {
        console.error("downloadOptions error----------------", err);
        res.status(500).json({ error: "Failed to fetch formats" });
    }
});

export default router;
