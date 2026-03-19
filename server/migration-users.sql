-- Migration: Add authentication fields to users table

-- Add role: 'admin', 'user', 'guest'
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'guest';

-- Add password hash for registered users (null for guests)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add is_active flag for banning users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add created_at for user management
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Update existing user 1 (访客) to be admin (that's you)
UPDATE users SET role = 'admin', name = '管理员', nickname = '管理员' WHERE id = 1;

-- Update existing user 2 to be a regular user
UPDATE users SET role = 'user' WHERE id = 2;
