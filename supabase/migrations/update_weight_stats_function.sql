-- Update the get_user_weight_stats function to consider profile weight as fallback
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
    WITH weight_logs_data AS (
        SELECT 
            w.weight,
            w.logged_at,
            ROW_NUMBER() OVER (ORDER BY w.logged_at DESC, w.created_at DESC) as rn
        FROM user_weight_logs w
        WHERE w.user_id = target_user_id
    ),
    profile_weight AS (
        SELECT weight as profile_weight_value
        FROM user_profiles 
        WHERE user_id = target_user_id
    ),
    weight_stats AS (
        SELECT 
            CASE 
                WHEN EXISTS (SELECT 1 FROM weight_logs_data) 
                THEN (SELECT weight FROM weight_logs_data WHERE rn = 1)
                ELSE (SELECT profile_weight_value FROM profile_weight)
            END as curr_weight,
            (SELECT weight FROM weight_logs_data WHERE rn = 2) as prev_weight,
            (SELECT COUNT(*) FROM user_weight_logs w WHERE w.user_id = target_user_id) as total_count,
            (SELECT MIN(logged_at) FROM user_weight_logs w WHERE w.user_id = target_user_id) as first_date,
            (SELECT MAX(logged_at) FROM user_weight_logs w WHERE w.user_id = target_user_id) as last_date
    ),
    averages AS (
        SELECT 
            CASE 
                WHEN EXISTS (SELECT 1 FROM user_weight_logs w WHERE w.user_id = target_user_id AND w.logged_at >= NOW() - INTERVAL '7 days')
                THEN AVG(w.weight)
                WHEN EXISTS (SELECT 1 FROM user_weight_logs w WHERE w.user_id = target_user_id)
                THEN NULL -- Has logs but none in last 7 days
                ELSE (SELECT profile_weight_value FROM profile_weight) -- No logs, use profile weight
            END as avg_7d,
            CASE 
                WHEN EXISTS (SELECT 1 FROM user_weight_logs w WHERE w.user_id = target_user_id AND w.logged_at >= NOW() - INTERVAL '30 days')
                THEN AVG(w.weight)
                WHEN EXISTS (SELECT 1 FROM user_weight_logs w WHERE w.user_id = target_user_id)
                THEN NULL -- Has logs but none in last 30 days
                ELSE (SELECT profile_weight_value FROM profile_weight) -- No logs, use profile weight
            END as avg_30d
        FROM user_weight_logs w
        WHERE w.user_id = target_user_id
        AND (w.logged_at >= NOW() - INTERVAL '30 days' OR NOT EXISTS (SELECT 1 FROM user_weight_logs WHERE user_id = target_user_id))
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
    FROM weight_stats s
    CROSS JOIN averages a;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_weight_stats(UUID) TO authenticated;