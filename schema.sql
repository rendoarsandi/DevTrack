-- Create status enum type
DO $$ BEGIN
    CREATE TYPE "status" AS ENUM ('awaiting_dp', 'in_progress', 'under_review', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE
);

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "status" NOT NULL DEFAULT 'awaiting_dp',
  "client_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "quote" INTEGER NOT NULL,
  "timeline" INTEGER NOT NULL,
  "payment_status" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "progress" INTEGER NOT NULL DEFAULT 0
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "projects"("id"),
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS "activities" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "projects"("id"),
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create session table for connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");