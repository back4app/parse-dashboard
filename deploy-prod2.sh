#!/bin/bash

if [[ ! $b4a_certs_path ]]; then echo 'Set b4a_certs_path environment variable, please!' && exit; fi

host=52.0.232.94
user=ubuntu
pem=Back4App_Production.pem
now=`date '+%Y%m%d%H%M%S'`

branch=master
git='~/bin/git-parse-dashboard'

ssh -t -o IdentitiesOnly=yes -i $b4a_certs_path/$pem $user@$host "sudo su back4app -c 'cp -r ~/scm/parse-dashboard2 ~/scm/parse-dashboard2-$now && . ~/.nvm/nvm.sh && nvm use 14 && cd ~/scm/parse-dashboard2 && rm -rf node_modules && $git reset --hard && $git remote update && $git checkout $branch && $git merge origin/$branch && npm install --production=false && sed -i \"s/http:\/\/localhost:4000\/parseapi/https:\/\/dashboard.back4app.com\/parseapi/\" node_modules/parse/lib/browser/settings.js && npm run build'"

# curl -X DELETE "https://api.cloudflare.com/client/v4/zones/69ace06909c83213745231d2c6d0fd27/purge_cache" -H "X-Auth-Email: $CF_EMAIL" -H "X-Auth-Key: $CF_KEY" -H "Content-Type: application/json" --data '{"files":[
#   "https://parse-dashboard.back4app.com/bundles/dashboard.bundle.js",
#   "https://parse-dashboard.back4app.com/bundles/PIG.bundle.js",
#   "https://parse-dashboard.back4app.com/bundles/login.bundle.js",
#   "https://parse-dashboard.back4app.com/bundles/quickstart.bundle.js",
#   "https://parse-dashboard.back4app.com/bundles/sprites.svg"
#   ]}'
