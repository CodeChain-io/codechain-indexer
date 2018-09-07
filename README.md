# CodeChain Indexer [![Build Status](https://travis-ci.org/CodeChain-io/codechain-indexer.svg?branch=master)](https://travis-ci.org/CodeChain-io/codechain-indexer)

Data synchronizing tool between CodeChain and ElasticSearch

## Table of Contents

- [Install](https://github.com/CodeChain-io/codechain-indexer#install)
- [Before start](https://github.com/CodeChain-io/codechain-indexer#before-start)
- [Run](https://github.com/CodeChain-io/codechain-indexer#run)

## Install

#### Requirements

The following are the software dependencies required to install and run CodeChain-indexer:

- [CodeChain](https://github.com/CodeChain-io/codechain) version of commit [`008b03`](https://github.com/CodeChain-io/codechain/commit/008b036289c3c2f5981fa5bd7e0887453edba9bd)
- ElasticSearch [`v6.2.4`](https://www.elastic.co/guide/en/beats/libbeat/6.2/elasticsearch-installation.html)
- Nodejs v10.4.1
- Yarn v1.9.2

#### Download

Download CodeChain-indexer code from the GitHub repository

```
# git clone git@github.com:kodebox-io/codechain-indexer.git
# cd codechain-indexer
```

#### Install package

Use yarn package manager to install packages

```
# yarn install
```

## Before start

#### Dependency

- Get CodeChain ready with CodeChain RPC server
- Get ElasticSearch database ready for indexing block data

## Run

Run CodeChain-indexer for indexing data to ElasticSearch

```
# yarn run start

// You can change ElasticSearch and CodeChain host URL using an environment variables.
# CODECHAIN_CHAIN=huksy CODECHAIN_HOST=http://52.79.108.1:8080 ELASTICSEARCH_HOST=http://127.0.0.1:9200 yarn run start
```

## Tools

#### Delete all indices in the elasticsearch

```
# yarn run clear
```

## Custom Configuration

|                    | Default               | Options     | Description |
| ------------------ | --------------------- | ----------- | ----------- |
| CODECHAIN_HOST     | http://127.0.0.1:8080 |             |             |
| ELASTICSEARCH_HOST | http://127.0.0.1:9200 |             |             |
| CODECHAIN_CHAIN    | solo                  | solo, husky |             |
