//import { fetchYoutubeMedia } from "./youtubeRapidApis";
import { getYoutubeVideoData } from "./youtubeData.js";

async function getVideoIdsFromPlaylist(playlistUrl) {
    const urlParams = new URLSearchParams(playlistUrl.split("?")[1]);
    const playlistId = urlParams.get("list");
    if (!playlistId) return [];

    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) throw new Error("Missing YouTube API key");

    let videoIds = [];
    let nextPageToken = "";

    do {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&pageToken=${nextPageToken}&key=${API_KEY}`
        );
        const data = await res.json();
        if (!data.items) break;



        const ids = data.items.map((item) => item.contentDetails.videoId);
        videoIds.push(...ids);

        nextPageToken = data.nextPageToken || "";

    } while (nextPageToken);

    return videoIds;
}

export async function fetchPlaylistData(playlistUrl) {
    const videoIds = await getVideoIdsFromPlaylist(playlistUrl);
    if (!videoIds.length) throw new Error("No videos found in playlist");

    const videoDataArray = await Promise.all(videoIds.map((vid) => getYoutubeVideoData(vid, "video")));
    // const videoDataArray = await Promise.all(videoIds.map((vid) => fetchYoutubeMedia(vid, "video")));

    return {
        detectedType: "playlist",
        playlistUrl,
        items: videoDataArray.map((vd) => ({
            id: vd.id,
            title: vd.title,
            description: vd.description,
            thumbnail: vd.thumbnail,
            videoUrl: vd.media?.[0]?.url || "",
            statistics: vd.statistics,
            detectedType: "video",
            type: "video",
        })),
    };
}
