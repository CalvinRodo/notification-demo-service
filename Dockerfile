FROM node:lts-slim
LABEL maintainer="-"

ARG GITHUB_SHA_ARG
ENV GITHUB_SHA=$GITHUB_SHA_ARG

COPY . /src

WORKDIR /src

RUN npm install --quiet --production

EXPOSE 3005

ENTRYPOINT [ "npm", "start" ]