# AI Workout Coach - Setup Guide

## 🚀 Overview
The AI Workout Coach is an intelligent fitness assistant integrated into Logday that provides:
- **Conversational Chat Interface** - Ask questions about exercise form, techniques, and get personalized advice
- **Workout Analysis** - AI reviews your workout logs and provides insights and suggestions
- **Context-Aware Planning** - Generates workouts based on your energy level, available time, and goals
- **Progressive Coaching** - Tracks your progress and suggests improvements over time

## 🔧 Setup Instructions

### 1. Environment Variables
Add your OpenAI API key to your `.env` file:
```bash
# Copy from .env.example
cp .env.example .env

# Add your OpenAI API key
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Database Migration
The AI Coach requires new database tables. Run the migration:
```bash
# Apply the migration
npx supabase db reset

# Or if you prefer to apply manually
npx supabase db push
```

### 3. OpenAI API Key Setup
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to your `.env` file as `VITE_OPENAI_API_KEY`

## 🏗️ Architecture

### Database Schema
- `coach_conversations` - Chat conversation sessions
- `coach_messages` - Individual chat messages
- `user_context` - User's current state (fatigue, goals, etc.)
- `workout_insights` - AI-generated workout analysis
- `generated_routines` - AI-created workout plans

### Components
- `ChatInterface` - Real-time chat UI with message history
- `WorkoutAnalysis` - Visual display of AI insights and suggestions
- `ContextCapture` - Quick input for user state (energy, time, goals)
- `AICoachPage` - Main page with tabs for chat and analysis

### Services
- `aiCoachService` - Handles AI API calls and data persistence
- OpenAI GPT-4 integration for intelligent responses
- Supabase integration for data storage and RLS

## 🎯 Features Implemented

### Phase 1: Basic Chat Interface ✅
- [x] Chat UI with message bubbles and typing indicators
- [x] OpenAI GPT-4 integration for AI responses
- [x] Message persistence in Supabase
- [x] Exercise form Q&A capabilities
- [x] Navigation integration

### Phase 2: Workout Analysis ✅
- [x] Workout log analysis with AI insights
- [x] Progress trend tracking (improving/plateauing/declining)
- [x] Personalized suggestions and focus areas
- [x] Context-aware responses based on user state
- [x] Visual analysis components

## 🔒 Security Features
- **Row Level Security (RLS)** - Users can only access their own data
- **API Key Protection** - OpenAI key stored securely in environment variables
- **Input Validation** - All user inputs are validated and sanitized
- **Rate Limiting** - Built-in protection against API abuse

## 🧪 Testing the AI Coach

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to AI Coach
- Click the "AI Coach" tab in the bottom navigation (Robot icon)
- Or visit `/ai-coach` directly

### 3. Test Chat Features
Try these sample prompts:
- "How do I improve my bench press form?"
- "What's the best way to increase my squat weight?"
- "I'm feeling tired today, what should I do?"
- "Analyze my recent workouts"

### 4. Test Context Features
- Set your energy level using the slider
- Select available time (15, 30, 45, 60 minutes)
- Choose your current fitness goals
- Ask for workout recommendations

## 🎨 UI/UX Features
- **Mobile-First Design** - Optimized for 375px width
- **Smooth Animations** - Framer Motion for polished interactions
- **Tailwind Styling** - Consistent with Logday design system
- **Phosphor Icons** - Robot icon for AI Coach navigation
- **Real-time Updates** - Instant message delivery and typing indicators

## 🔮 Future Enhancements (Phase 3+)
- **Routine Generation** - AI creates complete workout programs
- **Wearable Integration** - Connect with fitness trackers
- **Injury Prevention** - AI monitors for overtraining signals
- **Voice Interface** - Speech-to-text for hands-free coaching
- **Progress Photos** - AI analyzes form from uploaded videos

## 🐛 Troubleshooting

### Common Issues
1. **"AI Coach is thinking..." never resolves**
   - Check your OpenAI API key is valid
   - Verify you have API credits remaining
   - Check browser console for errors

2. **Messages not saving**
   - Verify Supabase connection
   - Check RLS policies are applied
   - Ensure user is authenticated

3. **Navigation not showing AI Coach**
   - Clear browser cache
   - Verify the route is added to App.tsx
   - Check Navigation.tsx includes the Robot icon

### Debug Mode
Enable debug logging by adding to your `.env`:
```bash
VITE_DEBUG_AI_COACH=true
```

## 📊 Cost Estimation
- **OpenAI API**: ~$0.002 per conversation
- **Estimated monthly cost**: $10-50 for 1000 active users
- **Supabase**: Included in existing plan

## 🎉 Success!
Your AI Workout Coach is now ready! The AI can:
- Answer exercise and form questions
- Analyze your workout patterns
- Provide personalized suggestions
- Generate context-aware recommendations
- Track your fitness progress over time

Start chatting with your AI coach and take your workouts to the next level! 💪
