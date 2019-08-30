#!/usr/bin/env bash
set -ex;

export NODE_ENV="test"
DATABASE="codechain-indexer-test"

function mktemp2 {
	PREFIX="$1"
	POSTFIX="$2"
	python -c "import tempfile; print(tempfile.NamedTemporaryFile(prefix='$PREFIX', suffix='$SUFFIX', delete=False).name)"
}
BEFORE=$(mktemp2 "${DATABASE}." ".schema.before.sql")
AFTER=$(mktemp2 "${DATABASE}." ".schema.after.sql")

LAST_BEFORE=$(perl -e 'my @files=`ls src/migrations`; print @files[-2]')
if [[ "${LAST_BEFORE}" = "" ]]; then 
    echo "$0: Can't find a migration file before the last one, exiting..."
    exit 1;
fi

yarn sequelize db:migrate --to "${LAST_BEFORE}"

pg_dump -s "${DATABASE}" > "${BEFORE}"

yarn sequelize db:migrate
yarn sequelize db:migrate:undo

pg_dump -s "${DATABASE}" > "${AFTER}"

diff "${BEFORE}" "${AFTER}"
