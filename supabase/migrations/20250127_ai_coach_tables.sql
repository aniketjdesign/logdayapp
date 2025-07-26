-- AI Coach Tables for Logday App
-- Migration: 20250127_ai_coach_tables.sql

-- Coach Conversations Table
CREATE TABLE coach_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coach Messages Table
CREATE TABLE coach_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Context Table (for fatigue, goals, etc.)
CREATE TABLE user_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fatigue_level INTEGER CHECK (fatigue_level >= 1 AND fatigue_level <= 10),
    available_time INTEGER, -- minutes
    goals TEXT[],
    preferences JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Workout Insights Table (AI-generated insights)
CREATE TABLE workout_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    insights TEXT[],
    suggestions TEXT[],
    progress_trend TEXT CHECK (progress_trend IN ('improving', 'plateauing', 'declining')),
    focus_areas TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Routines Table (AI-created workout plans)
CREATE TABLE generated_routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_name TEXT NOT NULL,
    routine_data JSONB NOT NULL,
    context JSONB, -- user context when generated
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_coach_conversations_user_id ON coach_conversations(user_id);
CREATE INDEX idx_coach_messages_conversation_id ON coach_messages(conversation_id);
CREATE INDEX idx_coach_messages_user_id ON coach_messages(user_id);
CREATE INDEX idx_workout_insights_user_id ON workout_insights(user_id);
CREATE INDEX idx_generated_routines_user_id ON generated_routines(user_id);

-- Row Level Security (RLS)
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_routines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations" ON coach_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own messages" ON coach_messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own context" ON user_context
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own insights" ON workout_insights
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own generated routines" ON generated_routines
    FOR ALL USING (auth.uid() = user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_coach_conversations_updated_at BEFORE UPDATE ON coach_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_context_updated_at BEFORE UPDATE ON user_context
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
