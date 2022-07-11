FROM node:16.14-slim

ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN npm i -g modclean && npm i -g typescript

COPY renderer/package*.json renderer/
WORKDIR renderer/

RUN npm i

COPY renderer/ ./

RUN npm run build
RUN npm prune --production
RUN modclean

CMD npm run start
