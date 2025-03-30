-- Add ip_address column to auth_rate_limits table
ALTER TABLE auth_rate_limits ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Add index for faster IP-based lookups
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_ip_address ON auth_rate_limits(ip_address);

-- Add index for combined ip+action lookups
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_ip_action ON auth_rate_limits(ip_address, action);
