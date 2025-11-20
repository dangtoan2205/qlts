#!/bin/sh
# Script chờ database sẵn sàng

echo "Waiting for database to be ready..."

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"
exec "$@"

