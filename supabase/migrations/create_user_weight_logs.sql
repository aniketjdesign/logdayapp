-- Create user_weight_logs table with proper architecture
CREATE TABLE IF NOT EXISTS user_weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(6,2) NOT NULL CHECK (weight > 0 AND weight <= 9999.99),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_weight_logs_user_id ON user_weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weight_logs_logged_at ON user_weight_logs(user_id, logged_at DESC);

-- Enable RLS
ALTER TABLE user_weight_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own weight logs" ON user_weight_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs" ON user_weight_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs" ON user_weight_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs" ON user_weight_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_weight_logs_updated_at
    BEFORE UPDATE ON user_weight_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to sync latest weight to user_profiles
CREATE OR REPLACE FUNCTION sync_latest_weight_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_profiles with the latest weight from user_weight_logs
    UPDATE user_profiles 
    SET 
        weight = (
            SELECT weight 
            FROM user_weight_logs 
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
            ORDER BY logged_at DESC, created_at DESC 
            LIMIT 1
        ),
        updated_at = NOW()
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to sync weight to user_profiles
CREATE TRIGGER sync_weight_after_insert
    AFTER INSERT ON user_weight_logs
    FOR EACH ROW
    EXECUTE FUNCTION sync_latest_weight_to_profile();

CREATE TRIGGER sync_weight_after_update
    AFTER UPDATE ON user_weight_logs
    FOR EACH ROW
    EXECUTE FUNCTION sync_latest_weight_to_profile();

CREATE TRIGGER sync_weight_after_delete
    AFTER DELETE ON user_weight_logs
    FOR EACH ROW
    EXECUTE FUNCTION sync_latest_weight_to_profile();

-- Create function to get weight statistics
CREATE OR REPLACE FUNCTION get_user_weight_stats(target_user_id UUID)
RETURNS TABLE (
    current_weight DECIMAL(6,2),
    previous_weight DECIMAL(6,2),
    weight_change DECIMAL(6,2),
    total_entries BIGINT,
    avg_last_7_days DECIMAL(6,2),
    avg_last_30_days DECIMAL(6,2),
    first_entry_date TIMESTAMPTZ,
    last_entry_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH weight_data AS (
        SELECT 
            w.weight,
            w.logged_at,
            ROW_NUMBER() OVER (ORDER BY w.logged_at DESC, w.created_at DESC) as rn
        FROM user_weight_logs w
        WHERE w.user_id = target_user_id
    ),
    stats AS (
        SELECT 
            (SELECT weight FROM weight_data WHERE rn = 1) as curr_weight,
            (SELECT weight FROM weight_data WHERE rn = 2) as prev_weight,
            COUNT(*) as total_count,
            MIN(logged_at) as first_date,
            MAX(logged_at) as last_date
        FROM user_weight_logs w
        WHERE w.user_id = target_user_id
    ),
    averages AS (
        SELECT 
            AVG(CASE WHEN w.logged_at >= NOW() - INTERVAL '7 days' THEN w.weight END) as avg_7d,
            AVG(CASE WHEN w.logged_at >= NOW() - INTERVAL '30 days' THEN w.weight END) as avg_30d
        FROM user_weight_logs w
        WHERE w.user_id = target_user_id
    )
    SELECT 
        s.curr_weight,
        s.prev_weight,
        CASE 
            WHEN s.curr_weight IS NOT NULL AND s.prev_weight IS NOT NULL 
            THEN s.curr_weight - s.prev_weight 
            ELSE NULL 
        END as weight_change,
        s.total_count,
        a.avg_7d,
        a.avg_30d,
        s.first_date,
        s.last_date
    FROM stats s
    CROSS JOIN averages a;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_weight_stats(UUID) TO authenticated;
