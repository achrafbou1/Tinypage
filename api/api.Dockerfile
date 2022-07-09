FROM node:16.14-slim
ENV NODE_ENV production
# Well folks, we tried to make this small, but this can't be helped...
# This is needed for the chromium instance for the internal screenshot api.

RUN apt update && apt install -y ca-certificates \
                                 fonts-liberation \
                                 libappindicator3-1 \
                                 libasound2 \
                                 libatk-bridge2.0-0 \
                                 libatk1.0-0 \
                                 libc6 \
                                 libcairo2 \
                                 libcups2 \
                                 libdbus-1-3 \
                                 libexpat1 \
                                 libfontconfig1 \
                                 libgbm1 \
                                 libgcc1 \
                                 libglib2.0-0 \
                                 libgtk-3-0 \
                                 libnspr4 \
                                 libnss3 \
                                 libpango-1.0-0 \
                                 libpangocairo-1.0-0 \
                                 libstdc++6 \
                                 libx11-6 \
                                 libx11-xcb1 \
                                 libxcb1 \
                                 libxcomposite1 \
                                 libxcursor1 \
                                 libxdamage1 \
                                 libxext6 \
                                 libxfixes3 \
                                 libxi6 \
                                 libxrandr2 \
                                 libxrender1 \
                                 libxss1 \
                                 libxtst6 \
                                 lsb-release \
                                 wget \
                                 xdg-utils


ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN npm i -g modclean && npm i -g typescript



COPY api/package*.json singlelink/
WORKDIR /singlelink
RUN npm install --only=prod

COPY editor/@types/editor-types.d.ts editor/@types/editor-types.d.ts
COPY api/ singlelink/
RUN npm run build
RUN npm prune --production
RUN modclean

CMD npm run start
