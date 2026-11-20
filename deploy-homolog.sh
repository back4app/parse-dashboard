#!/bin/bash

if [[ ! $b4a_certs_path ]]; then echo 'Set b4a_certs_path environment variable, please!' && exit; fi
if [[ ! $TURNSTILE_SITE_KEY ]]; then echo 'Set TURNSTILE_SITE_KEY environment variable (the back4app2 dashboards REACT_APP_BACK4APP2_DASHBOARD_TURNSTILE_SITE_KEY), please!' && exit; fi

host=34.192.186.60
user=ubuntu
pem=AppContainers.pem

branch=$(git symbolic-ref --short HEAD)
git='~/bin/git-parse-dashboard'

ssh -t -i $b4a_certs_path/$pem $user@$host "sudo su back4app -c '. ~/.nvm/nvm.sh && nvm use 14 && cd ~/scm/parse-dashboard && rm -rf node_modules && $git reset --hard && $git remote update && $git checkout $branch && $git merge origin/$branch && npm install && sed -i \"s/http:\/\/localhost:4000\/parseapi/https:\/\/dashboard-homolog.back4app.com\/parseapi/\" node_modules/parse/lib/browser/settings.js && TURNSTILE_SITE_KEY=$TURNSTILE_SITE_KEY npm run build-homolog'"