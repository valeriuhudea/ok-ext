FROM node:14.15.4-buster-slim AS app
LABEL maintainer="Valeriu Hudea <valeriu.hudea@wpp.com>"

ENV CI=true

WORKDIR /app

RUN apt-get update \
  && apt-get -y install dh-autoreconf libcurl4-gnutls-dev libexpat1-dev \
  gettext libz-dev libssl-dev git \
  && apt-get install -y build-essential curl libpq-dev --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man \
  && apt-get clean \
  && mkdir -p /node_modules && chown node:node -R /node_modules /app

USER node

COPY --chown=node:node package*.json ./

RUN npm install --only=production

ARG NODE_ENV="production"
ENV NODE_ENV="${NODE_ENV}" \
    PATH="${PATH}:/node_modules/.bin" \
    USER="node"

COPY --chown=node:node . .

EXPOSE 8080

CMD ["npm", "run", "prod"]