export default function parseCountText(text) {
    if (!text) return 0;
    text = text.replace(/,/g, "").trim();
    if (text.endsWith("K")) return parseFloat(text) * 1_000;
    if (text.endsWith("M")) return parseFloat(text) * 1_000_000;
    return parseInt(text, 10);
}


