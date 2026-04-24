#!/bin/bash
# Run once: bash setup_db.sh

set -e

# Find psql — check common install locations
PSQL=""
for candidate in \
    psql \
    /usr/local/bin/psql \
    /opt/homebrew/bin/psql \
    /opt/homebrew/opt/postgresql@14/bin/psql \
    /opt/homebrew/opt/postgresql@15/bin/psql \
    /opt/homebrew/opt/postgresql@16/bin/psql \
    /Applications/Postgres.app/Contents/Versions/latest/bin/psql \
    "/Library/PostgreSQL/16/bin/psql" \
    "/Library/PostgreSQL/15/bin/psql" \
    "/Library/PostgreSQL/14/bin/psql"
do
    if command -v "$candidate" &>/dev/null 2>&1 || [ -f "$candidate" ]; then
        PSQL="$candidate"
        break
    fi
done

if [ -z "$PSQL" ]; then
    echo ""
    echo "ERROR: psql not found."
    echo ""
    echo "Install PostgreSQL first:"
    echo "  Mac (Homebrew):  brew install postgresql@16"
    echo "  Mac (app):       https://postgresapp.com"
    echo "  Windows:         https://www.postgresql.org/download/windows"
    echo ""
    echo "After install, re-run: bash setup_db.sh"
    exit 1
fi

echo "Using psql: $PSQL"

# Homebrew installs use your macOS username as superuser, not "postgres"
PG_USER=""
for u in "$(whoami)" postgres; do
    if "$PSQL" -U "$u" -d template1 -c '\q' &>/dev/null 2>&1; then
        PG_USER="$u"
        break
    fi
done

if [ -z "$PG_USER" ]; then
    echo ""
    echo "ERROR: Cannot connect to PostgreSQL as '$(whoami)' or 'postgres'."
    echo ""
    echo "Make sure PostgreSQL is running:"
    echo "  brew services start postgresql@16"
    echo ""
    exit 1
fi

echo "Connecting as PostgreSQL user: $PG_USER"
echo "Setting up CandEvalAI database..."

"$PSQL" -U "$PG_USER" -d template1 << 'EOF'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hcl_user') THEN
    CREATE USER hcl_user WITH PASSWORD 'hcl_pass';
    RAISE NOTICE 'Created user hcl_user';
  ELSE
    RAISE NOTICE 'User hcl_user already exists';
  END IF;
END
$$;

SELECT 'CREATE DATABASE hcl_db OWNER hcl_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hcl_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE hcl_db TO hcl_user;
EOF

"$PSQL" -U "$PG_USER" -d hcl_db << 'EOF'
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'm5_final_reports') THEN
    ALTER TABLE m5_final_reports ADD COLUMN IF NOT EXISTS written_time_seconds FLOAT;
    ALTER TABLE m5_final_reports ADD COLUMN IF NOT EXISTS interview_time_seconds FLOAT;
    ALTER TABLE m5_final_reports ADD COLUMN IF NOT EXISTS coding_time_seconds FLOAT;
  END IF;
END
$$;
EOF

echo ""
echo "Done. Database ready."
