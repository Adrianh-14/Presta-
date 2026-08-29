#!/bin/sh
set -eu

if [ -z "${JwtSettings__SecretKey:-}" ]; then
    secret_part_one="$(tr -d '-' < /proc/sys/kernel/random/uuid)"
    secret_part_two="$(tr -d '-' < /proc/sys/kernel/random/uuid)"
    export JwtSettings__SecretKey="${secret_part_one}${secret_part_two}"
fi

exec dotnet PréstamoPlus.API.dll
