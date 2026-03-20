#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd /Users/michaelboshnack/Desktop/shoptheme
exec shopify theme dev --store postureguymike.myshopify.com --open
