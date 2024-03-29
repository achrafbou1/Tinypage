FROM node:16.14-slim
# Well folks, we tried to make this small, but this can't be helped...
## This is needed for the chromium instance for the internal screenshot api.

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
RUN yarn global add typescript modclean

COPY api/package.json api/yarn.lock api/
WORKDIR api/

RUN yarn install --non-interactive --link-duplicates

COPY editor/@types/editor-types.d.ts ../editor/@types/editor-types.d.ts
COPY api/ ./
RUN yarn run build && modclean -P -r

CMD yarn run start
