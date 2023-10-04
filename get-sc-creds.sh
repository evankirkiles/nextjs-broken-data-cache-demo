get_path="https://$VERCEL_URL/api/get-sc-creds?BUILD_SECRET=$BUILD_SECRET"
export $(curl -s $get_path | xargs)
