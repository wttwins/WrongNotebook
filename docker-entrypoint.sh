#!/bin/sh
set -e

# Define paths
SOURCE_DB="/app/prisma/dev.db"
TARGET_DB="/app/data/dev.db"

# Check if the persistent database exists
if [ ! -f "$TARGET_DB" ]; then
    echo "Initializing database..."
    if [ -f "$SOURCE_DB" ]; then
        echo "Copying pre-packaged database from $SOURCE_DB to $TARGET_DB"
        cp "$SOURCE_DB" "$TARGET_DB"
        # Ensure correct permissions
        chown nextjs:nodejs "$TARGET_DB"
    else
        echo "Warning: Source database not found at $SOURCE_DB. Skipping initialization."
    fi
else
    echo "Database already exists at $TARGET_DB. Skipping initialization."
fi

# Execute the main container command
exec "$@"
