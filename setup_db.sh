#!/bin/bash
# Run once: bash setup_db.sh
# Sets up PostgreSQL database for CandEvalAI

set -e

echo "Setting up CandEvalAI database..."

psql -U postgres << 'EOF'
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

psql -U postgres -d hcl_db << 'EOF'
ALTER TABLE m5_final_reports ADD COLUMN IF NOT EXISTS written_time_seconds FLOAT;
ALTER TABLE m5_final_reports ADD COLUMN IF NOT EXISTS interview_time_seconds FLOAT;
ALTER TABLE m5_final_reports ADD COLUMN IF NOT EXISTS coding_time_seconds FLOAT;
EOF

echo "Done. Database ready."
