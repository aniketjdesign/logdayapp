import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatInterface } from '../components/AICoach/ChatInterface';
import { ConversationHistory } from '../components/AICoach/ConversationHistory';
import { ContextCapture } from '../components/AICoach/ContextCapture';
import { aiCoachService, ChatMessage, UserContext } from '../services/aiCoachService';
import { Bot, History, Sparkles, X } from 'lucide-react';

export const AICoachPage: React.FC = () => {
  const { user } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [userContext, setUserContext] = useState<UserContext>({});

  useEffect(() => {
    if (user) {
      initializeConversation();
    }
  }, [user]);

  // iOS viewport fix
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  const initializeConversation = async () => {
    try {
      if (!user) return;
      
      // First, try to get existing conversations
      const existingConversations = await aiCoachService.getConversations(user.id);
      
      let currentConversationId: string;
      let history: ChatMessage[] = [];
      
      if (existingConversations.length > 0) {
        // Use the most recent conversation
        currentConversationId = existingConversations[0].id;
        history = await aiCoachService.getConversationHistory(currentConversationId);
      } else {
        // Only create a new conversation if there are none
        currentConversationId = await aiCoachService.createConversation(user.id);
      }
      
      setConversationId(currentConversationId);
      setMessages(history);

      // Send welcome message only for completely new conversations (no existing conversations at all)
      if (existingConversations.length === 0 && history.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: `Hey there! 👋 I'm your AI workout coach. I'm here to help you optimize your training, answer questions about exercise form, and create personalized workout plans.

What would you like to work on today? You can:
• Ask about exercise techniques
• Get feedback on your recent workouts
• Request a custom workout plan
• Discuss your fitness goals

How can I help you crush your fitness goals?`,
          timestamp: new Date(),
          conversation_id: currentConversationId
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    }
  };


  const handleSendMessage = async (message: string) => {
    if (!user || !conversationId) return;

    try {
      setIsLoading(true);
      
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        conversation_id: conversationId
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const aiResponse = await aiCoachService.sendMessage(
        message,
        conversationId,
        user.id,
        userContext
      );

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having trouble right now. Please try again in a moment.",
        timestamp: new Date(),
        conversation_id: conversationId
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextUpdate = (context: UserContext) => {
    setUserContext(context);
  };

  const handleSelectConversation = (newConversationId: string, newMessages: ChatMessage[]) => {
    setConversationId(newConversationId);
    setMessages(newMessages);
    setShowHistory(false);
  };

  return (
    <div 
      className="flex flex-col bg-gray-50" 
      style={{ 
        height: 'calc(var(--vh, 1vh) * 100)',
        minHeight: '100vh',
        paddingBottom: 'max(96px, calc(96px + env(safe-area-inset-bottom, 0px)))'
      }}
    >
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="text-white" size={16} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Coach</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Sparkles className="text-blue-500" size={18} />
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Conversation History"
            >
              {showHistory ? <X size={20} /> : <History size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
        {/* Chat Interface - Always Present */}
        <div className="h-full flex flex-col">
          {/* Compact Context Capture */}
          <div className="px-4 py-3 flex-shrink-0">
            <ContextCapture 
              onContextUpdate={handleContextUpdate}
              initialContext={userContext}
            />
          </div>

          {/* Chat Interface */}
          <div className="flex-1 min-h-0">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Ask your AI coach anything..."
            />
          </div>
        </div>

        {/* History Overlay */}
        {showHistory && (
          <div className="absolute inset-0 bg-white z-10">
            <ConversationHistory
              onSelectConversation={handleSelectConversation}
              currentConversationId={conversationId}
            />
          </div>
        )}
      </div>
    </div>
  );
};
