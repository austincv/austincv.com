#!/usr/bin/env bash
# Serve the site locally. Tries python3, then python2, then npx.
PORT=8080

if command -v python3 &>/dev/null; then
  echo "Serving at http://localhost:$PORT"
  python3 -m http.server $PORT
elif command -v python &>/dev/null; then
  echo "Serving at http://localhost:$PORT"
  python -m SimpleHTTPServer $PORT
elif command -v npx &>/dev/null; then
  npx serve . --listen $PORT
else
  echo "No suitable server found. Install python3 or Node.js."
  exit 1
fi
