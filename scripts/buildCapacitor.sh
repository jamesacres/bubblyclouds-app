#!/bin/bash
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home
rm -rf "apps/$1/dist"
rm -rf "apps/$1/out"
npm install
IS_CAPACITOR=true npm run build:$1 -- --force
cd "apps/$1"
pod repo update
npx cap sync
cd ../..