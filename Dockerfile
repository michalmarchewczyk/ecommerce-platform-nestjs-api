FROM node:18-alpine as base

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i -g @nestjs/cli


FROM base as dev

RUN npm ci

COPY . .


FROM base as prod

RUN npm ci

COPY . .

RUN npm run build

