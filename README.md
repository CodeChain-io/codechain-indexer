# CodeChain Indexer [![Build Status](https://travis-ci.org/CodeChain-io/codechain-indexer.svg?branch=master)](https://travis-ci.org/CodeChain-io/codechain-indexer)

A blockchain data indexing tool for CodeChain

## Table of Contents

- [Install](https://github.com/CodeChain-io/codechain-indexer#install)
- [Before start](https://github.com/CodeChain-io/codechain-indexer#before-start)
- [Run](https://github.com/CodeChain-io/codechain-indexer#run)

## Install

#### Requirements

The software dependencies required to install and run CodeChain-indexer are:

- Latest version of the [CodeChain](https://github.com/CodeChain-io/codechain)
- ElasticSearch [`v6.2.4`](https://www.elastic.co/guide/en/beats/libbeat/6.2/elasticsearch-installation.html)
- Nodejs higher than version 8

#### Download

Download CodeChain-indexer code from the GitHub repository

```
git clone git@github.com:kodebox-io/codechain-indexer.git
cd codechain-indexer
```

#### Install packages

Use yarn package manager to install packages

```
yarn install
```

## Before start

#### Dependency

- Get CodeChain ready with the CodeChain RPC server
- Get ElasticSearch database ready for indexing block data

#### Processor description

- Indexer

  - Client developed by react framework

- Server

  - Restful API server for getting data from DB

## Run

### Indexer

Run codechain-indexer to create indices on ElasticSearch

```
yarn run start-indexer

// You can change the ElasticSearch and the CodeChain host URL using the environment variables.
# CODECHAIN_CHAIN=huksy CODECHAIN_HOST=http://52.79.108.1:8080 ELASTICSEARCH_HOST=http://127.0.0.1:9200 yarn run start
```

### Server

Run CodeChain-indexer server to supply the restful API

```
# yarn run start-server

// You can change ElasticSearch and CodeChain host URL using an environment variables.
# CODECHAIN_HOST=http://52.79.108.1:8080 ELASTICSEARCH_HOST=http://127.0.0.1:9200 yarn run start-server
```

## Tools

#### Delete all indices from ElasticSearch

```
yarn run clear
```

## Custom Configuration

#### Indexer

|                      | Default               | Options             | Description |
| -------------------- | --------------------- | ------------------- | ----------- |
| CODECHAIN_HOST       | http://127.0.0.1:8080 |                     |             |
| ELASTICSEARCH_HOST   | http://127.0.0.1:9200 |                     |             |
| CODECHAIN_CHAIN      | solo                  | solo, husky, saluki |             |
| CODECHAIN_NETWORK_ID | tc                    | tc, sc, wc          |             |

#### Server

|                    | Default               | Options | Description |
| ------------------ | --------------------- | ------- | ----------- |
| CODECHAIN_HOST     | http://127.0.0.1:8080 |         |             |
| ELASTICSEARCH_HOST | http://127.0.0.1:9200 |         |             |
| SERVER_PORT        | 8081                  |
