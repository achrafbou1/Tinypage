FROM node:16.14-slim

ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN yarn global add typescript modclean

COPY renderer/package.json renderer/yarn.lock renderer/
WORKDIR renderer/

RUN yarn install  --non-interactive --link-duplicates

COPY renderer/ ./

RUN yarn run build && modclean -P -r

CMD yarn run start
