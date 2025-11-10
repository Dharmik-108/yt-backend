import express from "express";
import { fetchYoutubeMedia, fetchYoutubePost } from "../lib/youtubeRapidApis.js";
import { fetchPlaylistData } from "../lib/youtubePlaylistData.js";
import { getYoutubeVideoData } from "../lib/youtubeData.js";
import { withRateLimit } from "../lib/withRateLimit.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const getMediaTypeFromUrl = (u) => {
        if (/\/shorts\//i.test(u)) return "shorts";
        if (/\/playlist\//i.test(u) || /list=/.test(u)) return "playlist";
        if (/\/watch\//i.test(u) || /v=/.test(u)) return "video";
        if (/\/posts?\//i.test(u)) return "post";
        return "video";
    };

    const detectedType = getMediaTypeFromUrl(url);

    try {
        let data;

        if (detectedType === "video") {
            const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
            const videoId = match ? match[1] : null;
            if (!videoId) throw new Error("Invalid YouTube video URL");

            const result = await getYoutubeVideoData(videoId, detectedType);
            return res.status(200).json(result);
        } else if (detectedType === "shorts") {
            const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
            const videoId = match ? match[1] : null;
            if (!videoId) throw new Error("Invalid YouTube shorts URL");

            const result = await getYoutubeVideoData(videoId, detectedType);
            return res.status(200).json({ type: detectedType, ...result });
        } else if (detectedType === "playlist") {
            data = await fetchPlaylistData(url);
        } else if (detectedType === "post") {
            const match = url.match(/posts?\/([a-zA-Z0-9_-]+)/);
            const postId = match ? match[1] : null;
            if (!postId) throw new Error("Invalid YouTube post URL");

            data = await fetchYoutubePost(postId);
        }

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message || "Server error" });
    }
});

export default withRateLimit(router);
