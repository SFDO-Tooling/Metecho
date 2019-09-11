#!/bin/bash

SFDX_CLI_URL=https://developer.salesforce.com/media/salesforce-cli/sfdx-cli/channels/stable/sfdx-cli-linux-x64.tar.xz

mkdir sfdx
curl -s $SFDX_CLI_URL | tar xJ -C sfdx --strip-components 1

rm -rf "vendor/sfdx"
mkdir -p "vendor/sfdx"
cp -r sfdx "vendor/sfdx/cli"
chmod -R 755  "vendor/sfdx/cli"

ln -s /sfdx/bin/sfdx /usr/local/bin

sfdx force:auth:jwt:grant -d -a DevHub -i "$SFDX_CLIENT_ID" -f /server.key -u kit@oddbird.net
