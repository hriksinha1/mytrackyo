rm -rf node_modules
npm install
if [ $? -eq 0 ]; then
  echo "SUCCESS" > install-status.txt
else
  echo "FAILURE" > install-status.txt
fi
