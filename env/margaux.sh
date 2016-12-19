#!/bin/bash
source /usr/local/ap/.nvm/nvm.sh
cd /usr/local/ap/margaux
NODE_WEBSNAPSHOT_NUM_BROWSER=4 NODE_WEBSNAPSHOT_STORE_DIR=/usr/local/ap/strg node ./bin/cluster.js
