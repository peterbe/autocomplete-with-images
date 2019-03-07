#!/usr/bin/env bash
set -eo pipefail

yarn run build


gh-pages --add --dist build/
