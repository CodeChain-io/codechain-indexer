#!/bin/bash

echo $WAIT_COMMAND

is_ready() {
    eval "$WAIT_COMMAND"
}

# wait until is ready
i=0
while ! is_ready; do
    i=`expr $i + 1`
    if [ $i -ge $WAIT_LOOPS ]; then
        echo "$(date) - still not ready, giving up"
        exit 1
    fi
    echo "$(date) - waiting to be ready"
    sleep $WAIT_SLEEP
done

echo "Elasticsearch is up - executing command"
