FROM node:10.16.0

COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

WORKDIR /app

RUN yarn

CMD ["yarn", "webpack:serve"]
