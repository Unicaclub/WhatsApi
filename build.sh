#!/bin/bash
# Build script without sharp dependency

echo "Installing dependencies without sharp..."
npm install --production --legacy-peer-deps --ignore-optional

echo "Building application..."
npm run build

echo "Build completed successfully!"
