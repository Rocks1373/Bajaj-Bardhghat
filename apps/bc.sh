#!/bin/bash
cd "$(dirname "$0")/backend" || exit
echo "Starting Backend..."
npm run start:dev
