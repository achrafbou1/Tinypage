FROM node:16.14-slim

ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN npm i -g modclean && npm i -g typescript

COPY editor/package*.json editor/
WORKDIR editor/

RUN npm i

COPY editor/ ./

RUN npm run build
RUN npm prune --production
RUN modclean

CMD npm run start
