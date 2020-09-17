# Use minideb instead of alpine since some modules use native binary not supported in alpine
FROM node:10-slim
WORKDIR /code

# Install git because we currently fetch codechain core from github
RUN apt-get update && apt-get install -y git

# Copy package.json and lock file to install dependencies
COPY package.json yarn.lock /code/

# Install dependencies
RUN yarn install && yarn cache clean

# Copy codechain indexer
COPY . /code

# config will live in outside of docker image
RUN rm -r config

RUN yarn build

# Run server
CMD yarn run start
