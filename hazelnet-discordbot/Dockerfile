FROM node:alpine as build

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:alpine as run
WORKDIR /app
COPY --from=build ./app/dist ./dist
COPY package* ./
RUN npm install --only=prod && chown -R node:node dist
USER node
CMD ["node", "./dist"]