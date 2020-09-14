#!/usr/bin/env bash
set -ex;

export NODE_ENV="test"
DATABASE="codechain-indexer-test"

function mktemp2 {
	PREFIX="$1"
	POSTFIX="$2"
	python -c "import tempfile; print(tempfile.NamedTemporaryFile(prefix='$PREFIX', suffix='$SUFFIX', delete=False).name)"
}

UPSTREAM=schema-upstream.sql
MIGRATE=$(mktemp2 "${DATABASE}." ".schema.migrate.sql")

yarn sequelize db:migrate
pg_dump -s -d "${DATABASE}" > "${MIGRATE}"

# brew install pgFormatter
# apt install pgformatter
pg_format --nocomment -w 120 -o "${MIGRATE}" "${MIGRATE}"

case $1 in
diff-only)
	diff "${UPSTREAM}" "${MIGRATE}"
	;;
*)
	mv "${MIGRATE}" "${UPSTREAM}"
	;;
esac
