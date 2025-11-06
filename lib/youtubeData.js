export async function getYoutubeVideoData(videoId, detectedType) {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) throw new Error("YouTube API key missing");

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,player&id=${videoId}&key=${API_KEY}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok || data.error || !data.items?.length) {
        throw new Error(data.error?.message || "Failed to fetch YouTube video data");
    }

    const videoData = data.items[0];

    return {
        type: detectedType,
        id: videoId,
        title: videoData.snippet.title,
        description: videoData.snippet.description,
        thumbnail:
            videoData.snippet.thumbnails.maxres?.url ||
            videoData.snippet.thumbnails.high?.url ||
            videoData.snippet.thumbnails.default?.url,
        statistics: videoData.statistics,
        duration: videoData.contentDetails?.duration,
        media: [
            {
                url: `https://www.youtube.com/embed/${videoId}`,
            },
        ],
    };
}
