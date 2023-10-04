get_path="https://$VERCEL_BRANCH_URL/api/get-sc-creds?BUILD_SECRET=$BUILD_SECRET"
echo $get_path
export $(curl -s $get_path | xargs) >/dev/null
