FROM node:24-alpine

WORKDIR /app

RUN set -ex \
    && npm install -g pnpm@10

COPY ./package.json ./pnpm-lock.yaml ./
COPY ./prisma/ ./prisma/

RUN pnpm install

COPY . .

RUN set -ex \
    && pnpm run postinstall \
    && pnpm run build

USER node
EXPOSE 3000 9000

CMD [ "pnpm", "run", "start:prod" ]
