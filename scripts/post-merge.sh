#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

git config user.email "deploy@flirt-and-play.app"
git config user.name "Flirt & Play"
git remote remove github 2>/dev/null || true
git remote add github "https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/ezihe-building/ONLINE_GAME.git"
git push github HEAD:main --force
