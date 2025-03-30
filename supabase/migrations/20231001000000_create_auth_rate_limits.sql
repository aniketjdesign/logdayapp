-- Create the auth_rate_limits table
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ip_address TEXT
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_email_action ON auth_rate_limits (email, action);

-- Add RLS policies
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow the service role to read/write from this table
CREATE POLICY "Service Role Select" ON auth_rate_limits 
  FOR SELECT USING (auth.jwt() IS NOT NULL AND auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service Role Insert" ON auth_rate_limits 
  FOR INSERT USING (auth.jwt() IS NOT NULL AND auth.jwt()->>'role' = 'service_role'); 