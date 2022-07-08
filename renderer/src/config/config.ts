import {config as dotenvConfig} from "dotenv";

// Include .env as ENV variables via process.env
dotenvConfig();

let config = {
    // Host IP
    host: process.env.HOST ?? "0.0.0.0",

    // Define port for launch
    port: process.env.RENDERER_PORT ?? 80,

    // Define app name
    appName: process.env.APP_NAME ?? 'Tinypage',

    // Define free signup
    showWatermark: process.env.SHOW_WATERMARK === "true",

    // Watermark URL
    watermarkUrl: process.env.WATERMARK_URL ?? "https://tinypage.app/home",

    // Define hostname
    hostname: process.env.RENDERER_HOSTNAME ?? 'tinypage.app',

    // Define API URL
    apiUrl: process.env.API_URL ?? 'https://api.tinypage.app',

    // Define API URL
    editorUrl: process.env.EDITOR_URL ?? 'https://tinypage.app'
};

export default config;
