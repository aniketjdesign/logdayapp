-- First check if the table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_coach_conversations') THEN
    -- Create AI Coach conversations table
    CREATE TABLE public.ai_coach_conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ,
        
        CONSTRAINT ai_coach_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );

    -- Add RLS policies for ai_coach_conversations
    ALTER TABLE public.ai_coach_conversations ENABLE ROW LEVEL SECURITY;

    -- Policy for selecting conversations (users can only see their own)
    CREATE POLICY select_own_conversations ON public.ai_coach_conversations
        FOR SELECT USING (auth.uid() = user_id);

    -- Policy for inserting conversations (users can only insert their own)
    CREATE POLICY insert_own_conversations ON public.ai_coach_conversations
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Policy for updating conversations (users can only update their own)
    CREATE POLICY update_own_conversations ON public.ai_coach_conversations
        FOR UPDATE USING (auth.uid() = user_id);

    -- Policy for deleting conversations (users can only delete their own)
    CREATE POLICY delete_own_conversations ON public.ai_coach_conversations
        FOR DELETE USING (auth.uid() = user_id);

    -- Create index for faster queries
    CREATE INDEX idx_ai_coach_conversations_user_id ON public.ai_coach_conversations(user_id);
    CREATE INDEX idx_ai_coach_conversations_last_message_at ON public.ai_coach_conversations(last_message_at);
  ELSE
    -- Table already exists, ensure RLS is enabled
    ALTER TABLE public.ai_coach_conversations ENABLE ROW LEVEL SECURITY;
    
    -- Check and create policies if they don't exist
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'ai_coach_conversations' AND policyname = 'select_own_conversations') THEN
      CREATE POLICY select_own_conversations ON public.ai_coach_conversations
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'ai_coach_conversations' AND policyname = 'insert_own_conversations') THEN
      CREATE POLICY insert_own_conversations ON public.ai_coach_conversations
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'ai_coach_conversations' AND policyname = 'update_own_conversations') THEN
      CREATE POLICY update_own_conversations ON public.ai_coach_conversations
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'ai_coach_conversations' AND policyname = 'delete_own_conversations') THEN
      CREATE POLICY delete_own_conversations ON public.ai_coach_conversations
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    -- Check and create indexes if they don't exist
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'ai_coach_conversations' AND indexname = 'idx_ai_coach_conversations_user_id') THEN
      CREATE INDEX idx_ai_coach_conversations_user_id ON public.ai_coach_conversations(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'ai_coach_conversations' AND indexname = 'idx_ai_coach_conversations_last_message_at') THEN
      CREATE INDEX idx_ai_coach_conversations_last_message_at ON public.ai_coach_conversations(last_message_at);
    END IF;
  END IF;
END $$;
