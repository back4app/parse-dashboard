#!/bin/bash

# Back4App variables
host=34.192.186.60
user=ubuntu
pem=AppContainers.pem
branch=$(git symbolic-ref --short HEAD)
git='~/bin/git-parse-dashboard'

# Check if ENV VAR is defined
if [[ ! $b4a_certs_path ]]; then
    echo 'Set b4a_certs_path environment variable, please!' && exit
fi

# Define usage function
usage() {
    echo
    echo
    echo "Usage: $0 

        [--type <parse-dashboard, parse-dashboard2>] (required)
            Specifies the type of dashboard to deploy. Valid options are 'parse-dashboard' and 'parse-dashboard2'.

        [--remote <branch>] (optional)
            Specifies the Git 'remote' repository from which to deploy. 
            If not provided, the 'origin' remote will be used."
    
    echo 
    echo
}

# Initialize custom variables
remote=""
type=""
commands=""

# Parse command-line options
ARGS=$(getopt -o r:t: --long remote:,type: -n "$0" -- "$@")
eval set -- "$ARGS"

while true; do
    case "$1" in
        -r | --remote)
            remote="$2"
            shift 2
            ;;
        -t | --type)
            if [[ -z "$2" ]]; then
                echo "Error: Value for --type is empty."
                usage
                exit 1
            fi
            type="$2"
            shift 2
            ;;
        --)
            shift
            break
            ;;
        *)
            echo "Invalid option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check if origin or type are empty
if [[ -z "$remote" ]]; then
    remote="origin"
elif [[ -z "$type" ]]; then
    echo "--type must be provided."
    usage
    exit 1
fi


case "$type" in
    "parse-dashboard")
        folder="~/scm/parse-dashboard"
        ;;
    "parse-dashboard2")
        folder="~/scm/parse-dashboard2"
        ;;
    *)
        echo "Error: Invalid value for --type. Expected 'parse-dashboard' or 'parse-dashboard2'."
        usage
        exit 1
        ;;
esac

echo "Deploying origin: ${remote}"

commands+="sudo su back4app -c '. ~/.nvm/nvm.sh && nvm use 14 "
commands+="&& cd $folder && rm -rf node_modules && $git reset --hard "
commands+="&& $git remote update && $git remote update && $git checkout $branch && $git merge $remote/$branch "
commands+="&& npm install && sed -i \"s/http:\/\/localhost:4000\/parseapi/https:\/\/dashboard-homolog.back4app.com\/parseapi/\" node_modules/parse/lib/browser/settings.js "
commands+="&& npm run build-homolog'"

ssh -t -i $b4a_certs_path/$pem $user@$host $commands