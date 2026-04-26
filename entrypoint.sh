#!/bin/sh

# Apply migrations and initialize migrations if it does not exist
pnpm prisma generate
pnpm prisma migrate deploy

# Run the seed script safely on startup
pnpm dlx tsx prisma/seed.ts

# Run the CMD command from the dockerfile
exec "$@"
