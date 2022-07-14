import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import chalk from "chalk";
import axios, {AxiosResponse} from "axios";
import config from "./config/config";
import {StatusCodes} from "http-status-codes";
import ejs from "ejs";

import fs, {promises as fsPromises} from "fs";

interface MicrositeRequest extends FastifyRequest {
    Querystring: {
        token?: string,
        scrolling: string
    };
}

interface ProfileRequest extends FastifyRequest {
    Params: {
        profileId: string
    };
}

interface QRCodeRedirectRequest extends FastifyRequest {
    Params: {
        profileId: string
    };
}

/**
 * Creates all the routes.
 */
export class RouteHandler {
    fastify: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;

        fastify.setNotFoundHandler((request, reply) => {
            reply.status(StatusCodes.PERMANENT_REDIRECT);

            // language=HTML
            reply.redirect(config.editorUrl);
        });
    }

    /**
     * Register routes
     */
    registerRoutes() {
        // Redirect old format
        this.fastify.get("/u/:handle", (request, reply) => {
            // Get requested profile handle from URL
            const handle = request.url.replace('/u/', '');
            reply.redirect(StatusCodes.PERMANENT_REDIRECT, '/' + handle);
        });

        this.fastify.get("/qr/:profileId/redirect", async (request: FastifyRequest<QRCodeRedirectRequest>, reply) => {
            let profileId = request.params.profileId;

            let response = await axios.get<any>(`${config.apiUrl}/profile/qr/${profileId}`);

            if (!response.data?.id) {
                reply.status(404).send("Not found.");
                return;
            }

            reply.redirect(StatusCodes.PERMANENT_REDIRECT, '/' + response.data.handle);
        });

        this.fastify.get("/qr/:profileId", async (request: FastifyRequest<ProfileRequest>, reply) => {
            let profileId = request.params.profileId;

            let response = await axios.get<any>(`${config.apiUrl}/profile/qr/${profileId}`);

            if (!response.data?.id) {
                reply.status(404).send("Not found.");
                return;
            }

            const text = (await fsPromises.readFile(`${__dirname}/templates/qr.ejs`)).toString();

            let html = ejs.render(text, {
                profile: response.data,
                url: `${config.hostname}/${response.data.handle}`
            });

            reply.status(StatusCodes.OK).type("text/html").send(html);
        });

        this.fastify.get("/content-warning/:profileId", async (request: FastifyRequest<ProfileRequest>, reply) => {
            let profileId = request.params.profileId;

            let response = await axios.get<Profile>(`${config.apiUrl}/profile/qr/${profileId}`);

            let profile = response.data;

            if (!profile?.id) {
                reply.status(404).send("Not found.");
                return;
            }

            if (profile.visibility !== 'published-18+') {
                reply.redirect(StatusCodes.TEMPORARY_REDIRECT, `${config.hostname}/${response.data.handle}`);
                return;
            }

            const text = (await fsPromises.readFile(`${__dirname}/templates/content-warning.ejs`)).toString();

            let html = ejs.render(text, {
                profile: profile,
                acceptUrl: `//${config.hostname}/${response.data.handle}`,
                rejectUrl: config.editorUrl
            });

            reply.status(StatusCodes.OK).type("text/html").send(html);
        });

        /*
         Declare site route
         Route /*
        */
        this.fastify.get("*", async (request: FastifyRequest<MicrositeRequest>, reply: FastifyReply) => {
            // Get requested profile handle from URL
            const handle = request.url.replace('/', '');

            if (!handle) {
                reply.redirect(StatusCodes.PERMANENT_REDIRECT, config.editorUrl);
                return;
            }

            // Log MicrositeRequest
            console.log(`${chalk.cyan.bold(config.appName)}: Request received at /${handle} from ${request.ip}`);

            let response: AxiosResponse<{ profile: Profile, links: Link[], user: User, theme: Theme }> | undefined;

            const scrolling = request.query.scrolling === undefined || request.query.scrolling === "true";
            let isPreview = false;

            try {
                // Fetch profile from API

                if (request.query.token) {
                    response = await axios.post<{ profile: Profile, links: Link[], user: User, theme: Theme }>(`${config.apiUrl}/profile/${handle}`, {
                        token: request.query.token
                    });

                    isPreview = true;
                } else {
                    response = await axios.get<{ profile: Profile, links: Link[], user: User, theme: Theme }>(`${config.apiUrl}/profile/${handle}`);
                }

            } catch (err) {
                // Log error
                console.log(`${chalk.cyan.bold(config.appName)}: Error when processing request: ${err}`);
            }

            if (!response) {
                reply.type('text/html').status(404);

                // language=HTML
                return reply.send(`
                    <!DOCTYPE html>
                    <html lang="">
                    <head>
                        <title>${config.appName} Web Client</title>
                        <meta charset="UTF-8">
                        <link rel="icon" type="image/x-icon" href="/tinypage-logo.svg"/>
                        <link rel="icon" type="image/png" href="/tinypage-logo.svg"/>
                        <style>
                            .text {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                font-size: 30px;
                            }

                            .header {
                                color: #1a202c;
                                margin-bottom: 0.5rem;
                                font-weight: bolder;
                            }

                            .message {
                                font-size: 1.25rem;
                                color: #718096;
                                margin-bottom: 1rem;
                            }
                        </style>
                    </head>
                    <body>
                    <div class="text" style="width: 800px; height: 400px; margin: 0 auto; text-align: center">
                        <h1 class="header">404 - Not Found</h1>
                        <h3 class="message">We couldn't find what you were looking for, sorry!</h3>
                    </div>
                    <style>
                        @import url('https://rsms.me/inter/inter.css');

                        html {
                            font-family: 'Inter', sans-serif;
                        }

                        @supports (font-variation-settings: normal) {
                            html {
                                font-family: 'Inter var', sans-serif;
                            }
                        }
                    </style>
                    </body>
                    </html>
                `);
            }

            // Define profile
            const profile = response.data.profile;
            profile.headline = profile.headline ?? '';
            profile.subtitle = profile.subtitle ?? '';

            // Define theme = response.data.theme;
            const theme = response.data.theme ?? {
                customCss: '',
                customHtml: '',
            };

            if (!request.query.token && profile.visibility === "published-18+") {
                let warningAccepted = request.cookies.warningAccepted;

                if (!warningAccepted) {
                    reply.redirect(StatusCodes.TEMPORARY_REDIRECT, `//${config.hostname}/content-warning/${profile.id}`);
                    return;
                }
            }

            let avatarEnabled = profile.metadata?.showAvatar;

            // Define Avatar image
            const imageUrl = avatarEnabled ? profile.imageUrl : null;

            let avatarHtml = '';

            if (imageUrl) {
                // language=HTML
                avatarHtml = `<img class="nc-avatar mb-2" src="${imageUrl}" alt="avatar"/>`;
            } else if (profile.metadata?.coverImage) {
                // language=HTML
                avatarHtml = `<img class="nc-avatar mb-2" src=""
                                   alt="avatar"
                                   style="visibility: hidden; margin-top: min(calc(56.25vw - 65px), 130px);"
                />`;
            }

            if (request.query.token) {
                // This is a editor session, ignore
            } else {
                // Record page view
                if (!profile.metadata?.privacyMode)
                    await axios.get(`${config.apiUrl}/analytics/profile/record/${profile.id}`);
            }

            // Define Link HTML Block
            // language=HTML
            let linkHtml = '';

            // Define links & sort by order
            const links = response.data.links.sort(function (a: Link, b: Link) {
                return a.sortOrder - b.sortOrder;
            });

            //

            // Add link html to html block link-by-link
            for (let index = 0; index < links.length; index++) {
                let link = links[index];
                const hiddenLabel = link.metadata?.hiddenLabel;
                switch (link.type) {
                    case 'link': {
                        let subtitleHtml = '';
                        // language=HTML
                        if (link.subtitle) {
                            subtitleHtml = `<span
                                    class="text-sm text-gray-700 sl-link-subtitle mt-1"
                            >${link.subtitle}</span>`;
                        }
                        let style = link.style ?? '';
                        let customCss = link.customCss ?? '';

                        let buttonImage = link.metadata?.buttonImageUrl;
                        let buttonImageFullWidth = link.metadata?.buttonImageFullWidth;

                        let buttonImageHtml = '';
                        let buttonImageFullWidthCss = '';
                        let buttonImageSupportCss = '';

                        if (buttonImage) {

                            if (!buttonImageFullWidth) {
                                // language=HTML
                                buttonImageHtml = `<img src="${buttonImage}" class="button-image" alt="button image">`;
                                buttonImageSupportCss = 'overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;';
                            } else {
                                buttonImageFullWidthCss = `overflow: hidden; background-size: cover; background-position: center; background-image: url('${buttonImage}');`;
                            }
                        }

                        // language=HTML
                        linkHtml += `
                            <style>
                                ${customCss}
                            </style>


                        `;
                        if (!link.hidden) {
                            linkHtml += `<a
                                id="sl-item-${link.id}"
                                href="${config.apiUrl}/analytics/link/record/${link.id}"
                                class="w-full sl-item-parent mt-4"
                                target="_blank"
                                >
                                <div
                                    class="rounded-2xl shadow bg-white w-full font-medium mb-3 nc-link sl-item flex items-center justify-center"
                                style="${buttonImageFullWidthCss} position: relative; display: flex; flex-direction: row; justify-content: start; align-items: stretch; ${!subtitleHtml && buttonImageHtml ? 'min-height: 84px;' : ''} ${style}"
                                >
                                ${buttonImageHtml}
                                <span class="font-medium text-gray-900 sl-label"
                                ><span style="display: flow-root; flex-direction: column; justify-content: center; align-items: center; height: 100%; ${buttonImageSupportCss}"><span style="${hiddenLabel ? 'visibility: hidden;' : ''}">${link.label}</span>${subtitleHtml ? `<br>${subtitleHtml}` : ''}</span></span>
                                    </div>
                            </a>`;
                        }
                        break;
                    }
                    case 'gallery': {
                        if (link.items) {
                            linkHtml += `<div class="carousel">
  <div class="slides-${index}">
    
    ${(function fun() {
                                let html = '';
                                for (const item of link.items) {
                                    html += `<img src="${item.url}" alt="slide image" class="slide">`;
                                }
                                return html;
                            })()
                            }
  </div>
  <div class="controls">
    <div class="control prev-slide-${index}">&#9668;</div>
    <div class="control next-slide-${index}">&#9658;</div>
  </div>
</div>
<script>
let current_${index} = 0; 
function changeSlide(next = true, index) { 
  const slides = document.querySelector(".slides-" + index); 
  const slidesCount = slides.childElementCount; 
  const maxLeft = (slidesCount - 1) * 100 * -1; 
  if (next) { 
    current_${index} += current_${index} > maxLeft ? -100 : current_${index} * -1; 
  } 
  else { 
    current_${index} = current_${index} < 0 ? current_${index} + 100 : maxLeft; 
  } 
  slides.style.left = current_${index} + "%"; } 
  document.querySelector(".prev-slide-${index}").addEventListener("click", function () { changeSlide(false, ${index}); }); 
  document.querySelector(".next-slide-${index}").addEventListener("click", function () { changeSlide(true, ${index}) });
</script>       
`;
                        }
                        break;
                    }
                    case 'social': {
                        if (!link.metadata?.socialIcons || link.hidden)
                            break;
                        try {
                            let socialIcons: { type: string, color: string, scale: number, label: string, labelColor: string, customSvg: string, url: string }[] = link.metadata?.socialIcons ?? [];

                            if (socialIcons.length > 0) {
                                let style = link.style ?? '';
                                let customCss = link.customCss ?? '';

                                linkHtml += `
                                <style>
                                    ${customCss}
                                </style>
                                 <div class="social-button-list mt-4" style="${style}">`;
                            }

                            for (let i = 0; i < socialIcons.length; i++) {
                                let siSettings = socialIcons[i];
                                if (!siSettings.type)
                                    siSettings.type = "email";

                                if (!siSettings.color)
                                    siSettings.color = "#000000";

                                if (!siSettings.scale)
                                    siSettings.scale = 40;

                                let svgData = "";
                                let labelData = "";

                                switch (siSettings.type) {
                                    case "email":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/mail-outline.svg`).toString('utf-8');
                                        break;
                                    case "text":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/message.svg`).toString('utf-8');
                                        break;
                                    case "phone":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/call-outline.svg`).toString('utf-8');
                                        break;
                                    case "facebook":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-facebook.svg`).toString('utf-8');
                                        break;
                                    case "discord":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-discord.svg`).toString('utf-8');
                                        break;
                                    case "twitter":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-twitter.svg`).toString('utf-8');
                                        break;
                                    case "instagram":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-instagram.svg`).toString('utf-8');
                                        break;
                                    case "tiktok":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-tiktok.svg`).toString('utf-8');
                                        break;
                                    case "spotify":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-spotify.svg`).toString('utf-8');
                                        break;
                                    case "youtube":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-youtube.svg`).toString('utf-8');
                                        break;
                                    case "applemusic":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-apple-music.svg`).toString('utf-8');
                                        break;
                                    case "soundcloud":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-soundcloud.svg`).toString('utf-8');
                                        break;
                                    case "linkedin":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-linkedin.svg`).toString('utf-8');
                                        break;
                                    case "twitch":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-twitch.svg`).toString('utf-8');
                                        break;
                                    case "pinterest":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-pinterest.svg`).toString('utf-8');
                                        break;
                                    case "zoom":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-zoom.svg`).toString('utf-8');
                                        break;
                                    case "cuplr":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-cuplr.svg`).toString('utf-8');
                                        break;
                                    case "whatsapp":
                                        svgData = fs.readFileSync(`${__dirname}/static/icons/logo-whatsapp.svg`).toString('utf-8');
                                        break;
                                    case "custom":
                                        if (siSettings.customSvg)
                                            svgData = siSettings.customSvg;
                                        else
                                            svgData = fs.readFileSync(`${__dirname}/static/icons/question-mark.svg`).toString('utf-8');
                                }

                                let scale = null;
                                scale = siSettings.scale;

                                if (siSettings.label) {
                                    // language=HTML
                                    labelData = `
                                        <div class="sl-link-subtitle"
                                             style="color: ${siSettings.labelColor ?? 'inherit'}; white-space: nowrap;"
                                        >
                                            ${siSettings.label}
                                        </div>`;
                                } else {
                                    // language=HTML
                                    labelData = `
                                        <div class="sl-link-subtitle" style="white-space: nowrap;">
                                            &nbsp;
                                        </div>`;
                                }

                                // language=HTML
                                linkHtml += `
                                    <a id="sl-item-a-${link.id}-${i}"
                                       href="${siSettings.url}"
                                       class="social-button mt-4"
                                       target="_blank"
                                       style="color:${siSettings.color};"
                                       onclick="(async () => {
                                         let recordUrl = '${config.apiUrl}/analytics/link/record/${link.id}'
                                         const response = await fetch(recordUrl, {
                                           method: 'POST', 
                                           headers: {
                                          'Content-Type': 'application/json'
                                        }, 
                                        body: JSON.stringify({socialIconUrl: '${siSettings.url}'})
                                       })
                                       const link = response.json()
                                       window.open(link, '_blank');
                                       })()"
                                    >
                                        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                            ${svgData}
                                            ${labelData}
                                        </div>
                                        <script>
                                            {
                                                let svgElement = document.querySelector("#sl-item-a-${link.id}-${i} svg");
                                                svgElement.querySelector("title")?.remove();
                                                svgElement.setAttribute("style", "color:${siSettings.color};");
                                                let scale = ${scale};
                                                if (scale) {
                                                    svgElement.setAttribute("height", scale);
                                                    svgElement.setAttribute("width", scale);
                                                }

                                            }
                                        </script>
                                    </a>
                                `;
                            }

                            if (socialIcons.length > 0) {
                                linkHtml += `</div>`;
                            }
                        } catch (e) {
                            console.warn("Failed to parse social icon: " + link.subtitle);
                        }

                        break;
                    }
                    case 'vcard': {
                        let style = link.style ?? '';
                        let customCss = link.customCss ?? '';
                        let vCardData = link.metadata?.vCard ?? null;

                        if (!vCardData || link.hidden)
                            break;

                        let encodedVCard = encodeURI(vCardData);
                        let dataUrl = 'data:text/x-vcard;urlencoded,' + encodedVCard;

                        let buttonImage = link.metadata?.buttonImageUrl;
                        let buttonImageFullWidth = link.metadata?.buttonImageFullWidth;

                        let buttonImageHtml = '';
                        let buttonImageFullWidthCss = '';

                        if (buttonImage) {
                            if (!buttonImageFullWidth) {
                                // language=HTML
                                buttonImageHtml = `<img src="${buttonImage}" class="button-image" alt="button image">`;
                            } else {
                                buttonImageFullWidthCss = `overflow: hidden; background-size: cover; background-position: center; background-image: url('${buttonImage}');`;
                            }
                        }

                        let subtitleHtml = '';
                        // language=HTML
                        if (link.subtitle) {
                            subtitleHtml = `<span
                                    class="text-sm text-gray-700 sl-link-subtitle mt-1"
                            >${link.subtitle}</span>`;
                        }

                        // language=HTML
                        linkHtml += `
                            <style>
                                ${customCss}
                            </style>

                            <a
                                    id="sl-item-${link.id}"
                                    href="${config.apiUrl}/analytics/link/record/${link.id}"
                                    class="w-full sl-item-parent mt-4"
                                    onclick="{
                                           let recordUrl = '${config.apiUrl}/analytics/link/record/${link.id}'
                                           fetch(recordUrl, {method: 'POST'});

                                           window.open('${dataUrl}');
                                           return false;
                                       }"
                            >
                                <div
                                        class="rounded-2xl shadow bg-white w-full font-medium mb-3 nc-link sl-item flex items-center justify-center"
                                        style="${buttonImageFullWidthCss} position: relative; display: flex; flex-direction: row; justify-content: start; align-items: stretch; ${!subtitleHtml && buttonImageHtml ? 'min-height: 84px;' : ''} ${style}"
                                >
                                    ${buttonImageHtml}
                                    <span class="font-medium text-gray-900 sl-label"
                                    ><span style="display: flow-root; flex-direction: column; justify-content: center; align-items: center; height: 100%;"><span style="${hiddenLabel ? 'visibility: hidden;' : ''}">${link.label}</span>${subtitleHtml ? `<br>${subtitleHtml}` : ''}</span></span>
                                </div>
                            </a>
                        `;
                        break;
                    }

                    case 'image': {
                        let style = link.style ?? '';
                        let customCss = link.customCss ?? '';

                        if (!link.hidden) {
                            linkHtml += `
                            <style>
                                ${customCss}
                            </style>
                            <img id="sl-item-${link.id}" src="${link.url}" class="w-full h-auto mt-4"
                                 style="border-radius:4px;${style}" alt="link image"
                            />
                        `;
                        }
                        break;
                    }

                    case 'divider': {
                        if (!link.metadata?.dividerSettings || link.hidden)
                            break;

                        let style = link.style ?? '';
                        let customCss = link.customCss ?? '';

                        try {
                            let dividerSettings: { color: string, fontSize: number } = link.metadata?.dividerSettings ?? {};

                            if (!dividerSettings.color) {
                                dividerSettings.color = "#FFFFFFFF";
                            }

                            if (!dividerSettings.fontSize)
                                dividerSettings.fontSize = 18;

                            let color = dividerSettings.color;

                            // language=HTML
                            linkHtml += `
                                <style>
                                    ${customCss}
                                </style>

                                <div class="flex flex-row items-center justify-center w-full mt-4"
                                     style="${style}"
                                >
                                    <div style="flex-grow:1;background:${color};height:1px;"></div>
                                    <div style="margin:0 8px; text-transform:uppercase;font-weight:600;color:${color};letter-spacing:1px;font-size:${dividerSettings.fontSize};">
                                        ${link.label}
                                    </div>
                                    <div style="flex-grow:1;background:${color};height:1px;"></div>
                                </div>
                            `;
                        } catch (e) {
                            console.warn("Failed to parse divider: " + link.subtitle);
                        }
                        break;
                    }
                    case "text": {
                        let text = link.subtitle;
                        let style = link.style ?? '';
                        let customCss = link.customCss ?? '';

                        // language=HTML
                        if (!link.hidden) {
                            linkHtml += `
                                <style>
                                    ${customCss}
                                </style>
                                <div style="overflow: hidden; ${style}"
                                     class="rounded-2xl w-full font-medium mt-4"
                                >
                                    <div class="ql-editor">
                                        ${text}
                                    </div>
                                </div>
                            `;
                        }
                        break;
                    }
                    case "html": {
                        let text = link.subtitle;

                        let style = link.style ?? '';
                        let customCss = link.customCss ?? '';

                        // language=HTML
                        if (!link.hidden) {
                            linkHtml += `
                                <style>
                                    ${customCss}
                                </style>
                                <div style="overflow: hidden; ${style}"
                                     class="rounded-2xl w-full mt-4"
                                >
                                    ${text}
                                </div>
                            `;
                        }
                        break;
                    }
                    case 'youtube': {
                        let style = link.style ?? '';
                        let customCss = link.customCss ?? '';

                        let watchId = link.url.match(/v=([^&]*)/);
                        if (watchId && watchId.length > 0 && watchId[1]) {
                            if (!link.hidden) {
                                // language=HTML
                                linkHtml += `
                                    <style>
                                        ${customCss}
                                    </style>
                                    <style>
                                        .embed-container {
                                            border-radius: 4px;
                                            width: 100%;
                                            position: relative;
                                            padding-bottom: 56.25%;
                                            height: 0;
                                            overflow: hidden;
                                            max-width: 100%;
                                        }

                                        .embed-container iframe, .embed-container object, .embed-container embed {
                                            position: absolute;
                                            top: 0;
                                            left: 0;
                                            width: 100%;
                                            height: 100%;
                                        }</style>
                                    <div class="embed-container mt-4" style="${style}">
                                        <iframe title="youtube"
                                                src="https://www.youtube.com/embed/${watchId[1]}?playsinline=0&controls=2"
                                                frameborder="0" allowfullscreen
                                        ></iframe>
                                    </div>
                                `;
                            }
                        }
                    }
                        break;
                }
            }

            // Define headline HTML
            // language=HTML
            const headlineHtml = `<h1 class="text-black font-semibold text-2xl sl-headline">${profile.headline}</h1>`;

            // Define subtitle HTML
            let subtitleHtml = ``;
            // language=HTML
            if (profile.subtitle) {
                subtitleHtml = `<h3 class="text-gray-600 mb-4 sl-subtitle">${profile.subtitle}</h3>`;
            }

            // Define theme colors html
            let coverImageHtml = ``;

            if (profile.metadata?.coverImage) {
                // language=HTML
                coverImageHtml += `
                    <style>
                        img.nc-avatar {
                            border: solid 2px #FFF;
                            /* Your Avatar border width & color */
                            box-shadow: 0 2px 5px rgba(0, 0, 0, .25);
                            width: 120px;
                            height: 120px;
                            margin-top: min(calc(56.25vw - 65px), 180px);
                        }

                        body, html {
                            background-size: cover;
                            /* Placeholder BG Color if image doesn't load */
                            overflow-x: hidden !important;
                            position: relative;
                            z-index: -2;
                        }

                        .sl-banner {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            padding-bottom: min(56.25%, 240px);
                            width: 100%;
                            max-width: 35rem;
                            border-radius: 10px 10px 3px 3px;
                            background: #9D50BB; /* Your cover background color, fallback if image doesn't load/before image loads */
                            background: url('${profile.metadata?.coverImage}');
                            background-size: cover;
                            background-position: center;
                            margin: 0 auto 10px auto;
                            z-index: -1;
                        }

                        section {
                            margin-top: 10px;
                        }

                        .sl-bg {
                            background: transparent !important; /* DO NOT CHANGE */
                        }

                        @media (max-width: 400px) {
                            section {
                                margin-top: 0;
                            }

                            .sl-banner {
                                border-radius: 0 0 3px 3px;
                                margin: 0 auto;
                            }
                        }

                        section {
                            padding-top: 0 !important;
                        }
                    </style>
                `;
            }

            // Build watermark string
            let watermarkHtml = '';

            if (profile.showWatermark) {
                //language=HTML
                watermarkHtml += `
                    <div id="sl-watermark" class="sl-watermark flex flex-col items-center justify-center">`;

                //language=HTML
                watermarkHtml += `
                    <div style="color:rgba(0,0,0,1);max-width:230px;" class="mx-auto text-sm">
                        <a href="${config.watermarkUrl}">Proudly built with ${config.appName}</a>
                    </div>`;

                if (config.showWatermark) {
                    // language=HTML
                    watermarkHtml += `
                        <a class="text-blue-600 hover-underline text-sm" href="${config.editorUrl}/create-account"
                           target="_blank"
                        >
                            Create your free micro-site in minutes!
                        </a>`;
                }

                watermarkHtml += `<base target="_blank">`;
                watermarkHtml += `</div>`;
            }

            if (profile.customCss === null) {
                profile.customCss = '';
            }
            if (profile.customHtml === null) {
                profile.customHtml = '';
            }
            if (theme.customCss === null) {
                theme.customCss = '';
            }
            if (theme.customHtml === null) {
                theme.customHtml = '';
            }

            let shouldHideScrollbar = "";
            if (!scrolling) {
                //language=CSS
                shouldHideScrollbar = `
                    html {
                        overflow: scroll;
                        overflow-x: hidden;
                    }

                    ::-webkit-scrollbar {
                        width: 0; /* Remove scrollbar space */
                        background: transparent; /* Optional: just make scrollbar invisible */
                    }

                    /* Optional: show position indicator in red */
                    ::-webkit-scrollbar-thumb {
                        background: #FF0000;
                    }
                `;
            }

            let pageHtml = "";
            if (profile.metadata?.pageHtml) {
                pageHtml = profile.metadata.pageHtml;
            }

            let shareMenuHtml = "";
            if (profile.metadata?.shareMenu && !isPreview) {
                // language=HTML
                shareMenuHtml += `
                    <div id="qrcode"></div>

                    <script>
                        async function onClickCopyLink () {
                            try {
                                let text = window.location.href;

                                await window.navigator.clipboard.writeText(text);
                                alert('Url copied to clipboard!');
                            } catch (error) {
                                let text = window.location.href;

                                prompt('Copy this url to the clipboard: Ctrl+C, Enter\\n', text);
                            }
                        }

                        async function onClickQRCode () {
                            window.open('/qr/${profile.id}', '_blank').focus();
                        }
                    </script>

                    <div>

                    </div>

                    <div class="share-menu-container">
                        <div class="sbutton" onclick="onClickCopyLink(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                <path d="M336 192h40a40 40 0 0140 40v192a40 40 0 01-40 40H136a40 40 0 01-40-40V232a40 40 0 0140-40h40M336 128l-80-80-80 80M256 321V48"
                                      fill="none" stroke="currentColor" stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="32"
                                />
                            </svg>
                        </div>

                        <div class="sbutton" onclick="onClickQRCode(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                <rect x="336" y="336" width="80" height="80" rx="8" ry="8"/>
                                <rect x="272" y="272" width="64" height="64" rx="8" ry="8"/>
                                <rect x="416" y="416" width="64" height="64" rx="8" ry="8"/>
                                <rect x="432" y="272" width="48" height="48" rx="8" ry="8"/>
                                <rect x="272" y="432" width="48" height="48" rx="8" ry="8"/>
                                <rect x="336" y="96" width="80" height="80" rx="8" ry="8"/>
                                <rect x="288" y="48" width="176" height="176" rx="16" ry="16" fill="none"
                                      stroke="currentColor"
                                      stroke-linecap="round" stroke-linejoin="round" stroke-width="32"
                                />
                                <rect x="96" y="96" width="80" height="80" rx="8" ry="8"/>
                                <rect x="48" y="48" width="176" height="176" rx="16" ry="16" fill="none"
                                      stroke="currentColor"
                                      stroke-linecap="round" stroke-linejoin="round" stroke-width="32"
                                />
                                <rect x="96" y="336" width="80" height="80" rx="8" ry="8"/>
                                <rect x="48" y="288" width="176" height="176" rx="16" ry="16" fill="none"
                                      stroke="currentColor"
                                      stroke-linecap="round" stroke-linejoin="round" stroke-width="32"
                                />
                            </svg>
                        </div>
                    </div>
                `;
            }

            // Send response content type to text/html
            reply.type('text/html');

            // Send response to client
            // language=HTML
            return reply.send(`
                <!DOCTYPE html>
                <html lang="">
                <head>
                    <title>${profile.headline} - ${config.appName}</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">

                    <!-- Meta -->
                    <meta name="title" content="${profile.headline} - ${config.appName}">
                    <meta name="description"
                          content="${profile.subtitle} | Powered by ${config.appName}"
                    >

                    <!-- Open Graph-->
                    <meta property="og:title" content="${profile.metadata.previewTitle ?? profile.headline + ' - ' + config.appName}">
                    <meta property="og:description"
                          content="${profile.metadata.previewDescription ?? profile.subtitle} | Powered by ${config.appName}"
                    >
                    <meta property="og:image" content="${profile.metadata.previewImageUrl ?? config.apiUrl + '/profile/thumbnail/' + handle}">
                    <meta property="og:type" content="website">

                    <!-- Twitter Cards -->
                    <meta name="twitter:title" content="${profile.headline} - ${config.appName}">
                    <meta name="twitter:description"
                          content="${profile.subtitle} | Powered by ${config.appName}"
                    >
                    <meta name="twitter:image" content="${config.apiUrl}/profile/thumbnail/${handle}">
                    <meta name="twitter:card" content="summary_large_image">

                    <link rel="icon" type="image/x-icon" href="/tinypage-logo.svg"/>
                    <link rel="icon" type="image/png" href="/tinypage-logo.svg"/>

                    <link rel="stylesheet" href="/css/quill.core.min.css"/>

                    ${links.some(element => element.type == 'gallery') ? '<style>.carousel { aspect-ratio: 1/1; width: 100%; border-radius: 3px; overflow: hidden; position: relative; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2); } .carousel:hover .controls { opacity: 1; } .carousel .controls { opacity: 0; display: flex; position: absolute; top: 50%; left: 0; justify-content: space-between; width: 100%; z-index: 99999; transition: all ease 0.5s; } .carousel .controls .control { margin: 0 5px; display: flex; align-items: center; justify-content: center; height: 40px; width: 40px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.7); opacity: 0.5; transition: ease 0.3s; cursor: pointer; } .carousel .controls .control:hover { opacity: 1; } .carousel [class^="slides"] { position: absolute; top: 50%; left: 0; transform: translateY(-50%); display: flex; width: 100%; transition: 1s ease-in-out all; } .carousel [class^="slides"] .slide { min-width: 100%; height: auto; }</style>' : '\n'}

                    <!-- Tailwind CSS Embedded Styles -->
                    <style>
                        *, ::after, ::before {
                            box-sizing: border-box;
                            border-width: 0;
                            border-style: solid;
                            border-color: rgba(229, 231, 235, 1)
                        }

                        html {
                            -moz-tab-size: 4;
                            tab-size: 4
                            line-height: 1.15;
                            -webkit-text-size-adjust: 100%
                        }

                        body {
                            margin: 0
                            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                            line-height: 1.5
                        }

                        b, strong {
                            font-weight: bolder
                        }

                        blockquote, dd, dl, figure, h1, h2, h3, h4, h5, h6, hr, p, pre {
                            margin: 0
                        }

                        img {
                            border-style: solid
                        }

                        h1, h2, h3, h4, h5, h6 {
                            font-size: inherit;
                            font-weight: inherit
                        }

                        a {
                            color: inherit;
                            text-decoration: inherit
                        }

                        audio, canvas, embed, iframe, img, object, svg, video {
                            display: block;
                            vertical-align: middle
                        }

                        img, video {
                            max-width: 100%;
                            height: auto
                        }

                        .relative {
                            position: relative
                        }

                        .mx-auto {
                            margin-left: auto;
                            margin-right: auto
                        }

                        .mt-1 {
                            margin-top: .25rem
                        }

                        .mt-4 {
                            margin-top: 1rem
                        }

                        .mb-2 {
                            margin-bottom: .5rem
                        }

                        .mb-3 {
                            margin-bottom: .75rem
                        }

                        .mb-4 {
                            margin-bottom: 1rem
                        }

                        .flex {
                            display: flex
                        }

                        .h-auto {
                            height: auto
                        }

                        .min-h-screen {
                            min-height: 100vh
                        }

                        .w-full {
                            width: 100%
                        }

                        .w-screen {
                            width: 100vw
                        }

                        .flex-row {
                            flex-direction: row
                        }

                        .flex-col {
                            flex-direction: column
                        }

                        .items-center {
                            align-items: center
                        }

                        .justify-center {
                            justify-content: center
                        }

                        .rounded-2xl {
                            border-radius: 1rem
                        }

                        .bg-white {
                            background-color: rgba(255, 255, 255, 1)
                        }

                        .bg-gray-100 {
                            background-color: rgba(243, 244, 246, 1)
                        }

                        .p-4 {
                            padding: 1rem
                        }

                        .p-6 {
                            padding: 1.5rem
                        }

                        .pt-8 {
                            padding-top: 2rem
                        }

                        .pb-8 {
                            padding-bottom: 2rem
                        }

                        .text-center {
                            text-align: center
                        }

                        .text-sm {
                            font-size: .875rem;
                            line-height: 1.25rem
                        }

                        .text-2xl {
                            font-size: 1.5rem;
                            line-height: 2rem
                        }

                        .font-medium {
                            font-weight: 500
                        }

                        .font-semibold {
                            font-weight: 600
                        }

                        .text-black {
                            color: rgba(0, 0, 0, 1)
                        }

                        .text-gray-600 {
                            color: rgba(75, 85, 99, 1)
                        }

                        .text-gray-700 {
                            color: rgba(55, 65, 81, 1)
                        }

                        .text-gray-900 {
                            color: rgba(17, 24, 39, 1)
                        }

                        .shadow {
                            box-shadow: 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
                        }

                        ${theme.customCss}
                        ${profile.customCss}
                    </style>

                    <style>
                        .nc-avatar {
                            width: 60px;
                            height: 60px;
                            border-radius: 1000px;
                        }

                        .nc-link {
                            cursor: pointer;
                            transition: transform .15s ease-in-out;
                        }

                        .nc-link:hover {
                            transform: scale(1.02);
                        }

                        .nc-link:active {
                            transform: scale(1);
                        }

                        .sl-label {
                            margin: 1rem;
                            flex-grow: 1;
                            text-align: center;
                        }

                        .sl-watermark {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            background: rgba(255, 255, 255, 1);
                            border-radius: 1rem;
                            padding-left: 1rem;
                            padding-right: 1rem;
                            text-align: center;
                            margin-top: 1.1rem;
                        }

                        body {
                            overflow-x: hidden;
                        }

                        /*Override ql-editor settings*/
                        .ql-editor {
                            white-space: initial;
                            padding: 0;
                        }

                        .page-width {
                            max-width: 24rem;
                        }

                        .page-padding {
                            padding: 1.5rem;
                        }

                        @media (min-width: 540px) {
                            .page-width {
                                max-width: 35rem;
                            }
                        }

                        .button-image {
                            position: relative;
                            border-radius: 1rem;
                            max-height: 84px;
                        }
                    </style>

                    <style>
                        html, * {
                            font-family: 'Inter',
                            -apple-system,
                            BlinkMacSystemFont,
                            'Segoe UI',
                            Roboto,
                            'Helvetica Neue',
                            Arial,
                            sans-serif;
                            line-height: 1.65;
                            word-spacing: 1px;
                            -ms-text-size-adjust: 100%;
                            -webkit-text-size-adjust: 100%;
                            -moz-osx-font-smoothing: grayscale;
                            -webkit-font-smoothing: antialiased;
                            box-sizing: border-box;
                        }

                        h1.sl-headline, h3.sl-subtitle {
                            line-height: 1.65;
                            word-spacing: 1px;
                            -ms-text-size-adjust: 100%;
                            -webkit-text-size-adjust: 100%;
                            -moz-osx-font-smoothing: grayscale;
                            -webkit-font-smoothing: antialiased;
                        }

                        *,
                        *::before,
                        *::after {
                            box-sizing: border-box;
                            margin: 0;
                        }
                    </style>

                    <style>
                        .social-button-list {
                            display: flex;
                            flex-direction: row;
                            justify-content: center;
                            align-items: center;
                            margin: 0 auto;
                            width: 300px;
                            list-style: none;
                        }

                        .social-button {
                            display: inline-block;
                            padding: 0 .85rem;
                            cursor: pointer;
                            transition: all .15s ease-in-out;
                        }

                        .social-button :active,
                        .social-button :focus,
                        .social-button :hover {
                            filter: brightness(1.05);
                            cursor: pointer;
                        }
                    </style>

                    <style>
                        ${shouldHideScrollbar}
                    </style>

                    <style>
                        .share-menu-container {
                            top: 0;
                            right: 5px;
                            position: absolute;
                            margin: 1em;
                        }

                        @media (min-width: 650px) {
                            .share-menu-container {
                                right: unset;
                                left: calc(50% + 250px);
                            }
                        }

                        .sbutton {
                            display: flex;
                            align-items: center;

                            width: 45px;
                            height: 45px;
                            border-radius: 50%;
                            text-align: center;
                            margin: 5px auto 0;
                            background: rgba(255, 255, 255, 0.5);
                            box-shadow: 0 5px 11px -2px rgba(0, 0, 0, .5), 0 4px 12px -7px rgba(0, 0, 0, 0.15);
                            cursor: pointer;
                            -webkit-transition: all .1s ease-out;
                            transition: all .1s ease-out;
                            position: relative;
                            z-index: 3;
                        }

                        .sbutton > svg {
                            display: block;
                            width: 30px;
                            margin: 0 auto;
                        }

                        .sbutton:active,
                        .sbutton:focus,
                        .sbutton:hover {
                            box-shadow: 0 0 4px rgba(0, 0, 0, .14), 0 4px 8px rgba(0, 0, 0, .28);
                            cursor: pointer;
                        }

                        h1 {
                            font-size: 2em;
                        }

                        h2 {
                            font-size: 1.5em;
                        }

                        h3 {
                            font-size: 1.17em;
                        }

                        h4 {
                            font-size: 1em;
                        }

                        h5 {
                            font-size: .83em;
                        }

                        h6 {
                            font-size: .67em;
                        }
                    </style>
                </head>
                <body>
                <div class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg">
                    <div
                            id="user-site-view"
                            class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg"
                    >
                        <section class="flex flex-col p-6 pt-8 pb-8 items-center text-center page-width w-full"
                        >
                            ${shareMenuHtml}
                            ${avatarHtml}
                            ${headlineHtml}
                            ${subtitleHtml}
                            ${linkHtml}
                            <!-- Theme html -->
                            <div id="theme-html">
                                <div class="sl-banner"></div>
                            </div>
                            <!-- Watermark -->
                            ${watermarkHtml}
                            ${coverImageHtml}
                            ${pageHtml}
                        </section>
                    </div>
                </div>
                </body>
                </html>
            `);
        });
    }
}
