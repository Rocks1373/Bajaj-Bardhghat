#!/bin/bash
cd "$(dirname "$0")/frontend" || exit
echo "Starting Frontend..."
npm run dev
