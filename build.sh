#!/bin/bash
set -e

name=$(basename "$PWD")
version="v1.0.0"
image_repo="celcomcne2021"

echo "Project: $name"
echo "Version: $version"

echo "Building Docker image..."
docker build -t $name:$version .

echo "Tagging image..."
docker tag $name:$version $image_repo/$name:$version

echo "Pushing image..."
docker push $image_repo/$name:$version

echo "Done"