FROM node:alpine

WORKDIR /usr/src/hazelnet

COPY package.json /usr/src/hazelnet

RUN npm install

COPY . .

USER node

CMD ["node", "index.js"]