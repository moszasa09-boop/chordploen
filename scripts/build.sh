#!/bin/zsh
# Build the standalone site (index.html) from src/page.html.
# src/page.html has no <html>/<head>/<body> tags (Claude artifacts add them at publish time),
# so this wraps everything up to the first </style> in <head> and the rest in <body>.
set -e
cd "${0:A:h}/.."
SRC=src/page.html
OUT=index.html
{
  printf '<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>html,body{margin:0;height:100%%}img{max-width:100%%}</style>\n'
  awk 'BEGIN{h=1} { if(h) print; if(h && /<\/style>/) h=0 }' "$SRC"
  printf '</head>\n<body>\n'
  awk 'BEGIN{h=1} { if(!h) print; if(h && /<\/style>/) h=0 }' "$SRC"
  printf '</body>\n</html>\n'
} > "$OUT"
mkdir -p dist && cp "$OUT" dist/index.html
echo "built $OUT and dist/index.html"
