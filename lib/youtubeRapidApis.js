import axios from "axios";
import parseCountText from "../utils/commentCount.js";

const normalizeQuality = (q) => {
    if (!q) return "0p";
    const num = q.match(/\d+/);
    return num ? num[0] + "p" : "0p";
};

export async function fetchYoutubeMedia(videoId, detectedType) {
    const options = {
        method: "GET",
        url: "https://youtube-media-downloader.p.rapidapi.com/v2/video/details",
        params: {
            videoId,
            urlAccess: "normal",
            merge: "true",
            videos: "auto",
            audios: "auto",
        },
        headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY,
            "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com",
        },
    };

    const response = await axios.request(options);
    const data = response.data;

    const mp4Videos = data.videos?.items
        ?.filter((item) => item.url && item.extension && item.extension.toLowerCase().includes("mp4"))
        ?.map((item) => ({
            url: item.url,
            quality: item.quality ? item.quality.toLowerCase() : "unknown",
            type: "MP4",
            size: item.sizeText || null,
        })) || [];

    const qualityOrder = ["1080p", "720p", "480p", "360p", "240p", "144p",];

    const sortedVideos = mp4Videos.sort(
        (a, b) => qualityOrder.indexOf(normalizeQuality(a.quality)) - qualityOrder.indexOf(normalizeQuality(b.quality))
    );

    const uniqueVideos = [];
    const seen = new Set();
    for (const video of sortedVideos) {
        const q = normalizeQuality(video.quality);
        if (!seen.has(q)) {
            seen.add(q);
            uniqueVideos.push(video);
        }
    }

    const firstAudio = data.audios?.items?.[0] || null;

    return {
        id: videoId,
        title: data.title || "",
        description: data.description || "",
        thumbnail: data.thumbnail || "",
        media: uniqueVideos,
        firstAudio,
        availableQualities: uniqueVideos.map((v) => ({ type: v.type, quality: normalizeQuality(v.quality) })),
        statistics: {
            viewCount: data.viewCount || 0,
            likeCount: data.likeCount || 0,
            commentCount: parseCountText(data.commentCountText) || 0,
        },
        detectedType,
        type: detectedType,
    };
}

export async function fetchYoutubePost(postId) {
    return {
        id: postId || "unknown",
        title: "Post Placeholder",
        description: "",
        thumbnail: "",
        media: [],
        statistics: {},
        detectedType: "post",
        type: "post",
    };
}
