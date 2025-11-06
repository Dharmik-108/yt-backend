import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import audioInfo from "./routes/audioInfo.js";
import download from "./routes/download.js";
import downloadMp3 from "./routes/downloadMp3.js";
import downloadOptions from "./routes/downloadOptions.js";
import youtube from "./routes/youtube.js";

const app = express();

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true); // allow server-to-server
            if (
                origin.includes("vercel.app") ||
                origin.includes("localhost")
            ) {
                return callback(null, true);
            }
            callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST"],
    })
);

// Middleware
app.use(express.json());

// Routes
app.use("/api/audioInfo", audioInfo);
app.use("/api/download", download);
app.use("/api/downloadMp3", downloadMp3);
app.use("/api/downloadOptions", downloadOptions);
app.use("/api/youtube", youtube);

app.get("/", (_, res) => res.send("yt-dlp backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
    console.log(`✅ Server running on port ${PORT}`)
);
