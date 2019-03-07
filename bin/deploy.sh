#!/usr/bin/env bash
set -eo pipefail

# This prefix is for github pages
PUBLIC_URL="/autocomplete-with-images" yarn run build


gh-pages --add --dist build/
