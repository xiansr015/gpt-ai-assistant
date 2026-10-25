FROM node:26-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

RUN mkdir -p data && chown node:node data

USER node

CMD [ "node", "api/index.js" ]
