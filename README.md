# CodeChain Indexer [![Build Status](https://travis-ci.org/CodeChain-io/codechain-indexer.svg?branch=master)](https://travis-ci.org/CodeChain-io/codechain-indexer)

A blockchain data indexing tool for CodeChain

## Table of Contents

- [Install](https://github.com/CodeChain-io/codechain-indexer#install)
- [Before start](https://github.com/CodeChain-io/codechain-indexer#before-start)
- [Run](https://github.com/CodeChain-io/codechain-indexer#run)

## Install

#### Requirements

The software dependencies required to install and run CodeChain-indexer are:

- [CodeChain](https://github.com/CodeChain-io/codechain) commit version [`008b03`](https://github.com/CodeChain-io/codechain/commit/008b036289c3c2f5981fa5bd7e0887453edba9bd)
- ElasticSearch [`v6.2.4`](https://www.elastic.co/guide/en/beats/libbeat/6.2/elasticsearch-installation.html)
- Nodejs v10.4.1
- Yarn v1.9.2

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

## Run

Run codechain-indexer to create indices on ElasticSearch

```
yarn run start

// You can change the ElasticSearch and the CodeChain host URL using the environment variables.
# CODECHAIN_CHAIN=huksy CODECHAIN_HOST=http://52.79.108.1:8080 ELASTICSEARCH_HOST=http://127.0.0.1:9200 yarn run start
```

## Tools

#### Delete all indices from ElasticSearch

```
yarn run clear
```

## Custom Configuration

|                      | Default               | Options             | Description |
| -------------------- | --------------------- | ------------------- | ----------- |
| CODECHAIN_HOST       | http://127.0.0.1:8080 |                     |             |
| ELASTICSEARCH_HOST   | http://127.0.0.1:9200 |                     |             |
| CODECHAIN_CHAIN      | solo                  | solo, husky, saluki |             |
| CODECHAIN_NETWORK_ID | tc                    | tc, sc              |             |
