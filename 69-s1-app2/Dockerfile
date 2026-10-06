FROM node:22-alpine

RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /opt

COPY package.json package-lock.json ./

RUN npm install -g node-gyp
RUN npm config set fetch-retry-maxtimeout 600000 -g
RUN npm ci

ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app

COPY . .

RUN mkdir -p /opt/app/public/uploads && chown -R node:node /opt/app

USER node

EXPOSE 1337

CMD ["npm", "run", "develop"]