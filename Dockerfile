ARG NODE_IMAGE=node:16.13.1-alpine

FROM $NODE_IMAGE AS base
RUN apk --no-cache add dumb-init
RUN mkdir -p /home/node/app && chown node:node /home/node/app
WORKDIR /home/node/app
USER node
RUN mkdir tmp

FROM base AS dependencies
COPY --chown=node:node ./package*.json ./
RUN npm ci
COPY --chown=node:node . .

FROM dependencies AS build
RUN node ace build --production

FROM base AS production
ENV PORT=3838
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV APP_KEY=nofallomuitoportugues
ENV DRIVE_DISK=local
ENV APP_NAME="Telos Comment"
ENV HYPERION_ENDPOINT=https://testnet.telos.caleos.io
ENV COMMENT_SMART_CONTRACT=testcomments
ENV DB_CONNECTION=pg
ENV PG_HOST=localhost
ENV PG_PORT=5432

ENV PG_DB_NAME=comment
ENV REDIS_CONNECTION=local
ENV REDIS_HOST=127.0.0.1
ENV REDIS_PORT=6379
ENV REDIS_PASSWORD=
ENV DSTOR_IPFS_BASE_URL=https://api.dstor.cloud/ipfs
ENV DSTOR_API_KEY=OlRxGyBCDJH351kgliCReO5rwU7xnXweorlA7b5DzpWiVztu7nW8QWKJJHeVt55G
ENV UPLOAD_BYTES_LIMIT=30000
COPY --chown=node:node ./package*.json ./
RUN npm ci --production
COPY --chown=node:node --from=build /home/node/app/build .
EXPOSE $PORT
RUN npm run migrate:force
CMD ["dumb-init", "node", "server.js"]
