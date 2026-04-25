FROM node:24-alpine

WORKDIR /app

RUN set -ex \
  && apk add --no-cache \
    curl \
    shadow \
    git \
  && npm install -g pnpm@10

ARG PGID=1000
ARG PUID=1000

RUN set -eux \
  && groupadd -o --gid ${PGID} workspace \
  && useradd -o --uid ${PUID} --gid workspace --shell /bin/sh --create-home workspace \
  && mkdir -p /workspace \
  && chown workspace:workspace -R /workspace

USER workspace:workspace
WORKDIR /workspace

EXPOSE 3000 9000
