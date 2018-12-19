CREATE DATABASE "codechain-indexer-dev";
CREATE DATABASE "codechain-indexer-test";
CREATE USER "user" WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE "codechain-indexer-dev" TO "user";
GRANT ALL PRIVILEGES ON DATABASE "codechain-indexer-test" TO "user";
