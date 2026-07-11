-- Add ban fields to users table
ALTER TABLE users 
ADD COLUMN ban_reason TEXT,
ADD COLUMN banned_at TIMESTAMP,
ADD COLUMN banned_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for banned users
CREATE INDEX idx_users_is_banned ON users(is_banned);
CREATE INDEX idx_users_banned_at ON users(banned_at);