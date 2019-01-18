CREATE USER "user" WITH ENCRYPTED PASSWORD 'password';
CREATE DATABASE "codechain-indexer-dev" WITH OWNER "user";
CREATE DATABASE "codechain-indexer-test" WITH OWNER "user";
CREATE DATABASE "codechain-indexer-test-int" WITH OWNER "user";
GRANT ALL PRIVILEGES ON DATABASE "codechain-indexer-dev" TO "user";
GRANT ALL PRIVILEGES ON DATABASE "codechain-indexer-test" TO "user";
GRANT ALL PRIVILEGES ON DATABASE "codechain-indexer-test-int" TO "user";
