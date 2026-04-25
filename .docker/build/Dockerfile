FROM node:24-alpine

RUN set -ex \
    && npm install -g pnpm@10

USER node

WORKDIR /app

COPY --chown=node:node ./package.json ./pnpm-lock.yaml ./
COPY --chown=node:node ./prisma/ ./prisma/

RUN pnpm install

COPY --chown=node:node . .

RUN set -ex \
    && pnpm run postinstall \
    && pnpm run build

EXPOSE 3000 9000

CMD [ "pnpm", "run", "start:prod" ]
