Integration tests of CodeChain Indexer
======================================

This project contains integration tests of CodeChain Indexer.


How the tests run
------------------

Each test sets the DB using SQL files, runs the indexer, and then queries to the indexer.

You can run the tests by `yarn run test`.


How to create `sqls/*.sql` files
--------------------------------

Because the required data differs according to the test, SQL files necessary for each test are created in `sqls/` directory.

You can create the SQL file by `yarn run create-fixture`.

