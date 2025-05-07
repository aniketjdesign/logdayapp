import React, { useState, useRef, useEffect } from 'react';
import { ChatDots, PaperPlaneTilt, Barbell, ArrowsOutLineVertical, MagnifyingGlass, Hamburger, ArrowLeft, DotsThreeVertical } from 'phosphor-react';
import { motion } from 'framer-motion';
import { openAIService, ChatMessage } from '../services/openai';
import { aiCoachService } from '../services/aiCoachService';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import '../styles/markdown.css';

// Define message interface
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  
  // State for messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('New Conversation');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load chat from localStorage on component mount
  useEffect(() => {
    loadChatFromLocalStorage();
  }, []);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatToLocalStorage();
    }
  }, [messages]);

  // Load chat from localStorage
  const loadChatFromLocalStorage = () => {
    try {
      const savedChat = localStorage.getItem('logday_ai_chat');
      if (savedChat) {
        const parsedChat = JSON.parse(savedChat);
        setMessages(parsedChat.messages || []);
        setConversationTitle(parsedChat.title || 'AI Coach');
      }
    } catch (error) {
      console.error('Error loading chat from localStorage:', error);
    }
  };

  // Save chat to localStorage
  const saveChatToLocalStorage = () => {
    try {
      const chatData = {
        title: conversationTitle,
        messages: messages,
        last_updated: new Date().toISOString()
      };
      localStorage.setItem('logday_ai_chat', JSON.stringify(chatData));
      console.log('Chat saved to localStorage');
    } catch (error) {
      console.error('Error saving chat to localStorage:', error);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setConversationTitle('New Conversation');
    localStorage.removeItem('logday_ai_chat');
    setShowMenu(false);
  };

  // Generate system prompt with comprehensive user data
  const generateSystemPrompt = async () => {
    try {
      // Load all user data in parallel for efficiency
      const [
        workoutSummary, 
        workoutTrends, 
        userRoutines, 
        userSettings, 
        userExercises
      ] = await Promise.all([
        aiCoachService.getUserWorkoutSummary(),
        aiCoachService.getWorkoutTrends(),
        aiCoachService.getUserRoutines(),
        aiCoachService.getUserSettings(),
        aiCoachService.getUserExercises()
      ]);
      
      return `You are an AI fitness coach for the Logday workout app. Your name is Coach.
You have access to the user's complete workout history and can provide personalized advice.

${workoutSummary}

${workoutTrends}

${userRoutines}

${userSettings}

${userExercises}

Based on this comprehensive data, you can:
1. Analyze the user's complete workout history and progression
2. Suggest new routines or modifications to existing ones based on their current routines
3. Provide personalized advice on training, recovery, and nutrition
4. Help identify strengths, weaknesses, and imbalances in their training
5. Create custom workout plans based on their history, goals, and available exercises
6. Recommend specific exercises from their exercise library that would benefit them

Keep your responses concise, practical, and tailored to the user's specific workout history and preferences.
Always respect the user's preferred weight unit (${userSettings.includes("lbs") ? "lbs" : "kg"}) when discussing weights.
Avoid generic advice that doesn't take their data into account.

IMPORTANT: Format your responses using markdown. You can use:
- **Bold** and *italic* text for emphasis
- Bullet points and numbered lists for organization
- Tables for structured data (especially for workout plans)
- Headers for section titles
- Code blocks for specific instructions or routines

Example of a good table format for a workout plan:
| Exercise | Sets | Reps | Weight | Notes |
|---------|------|------|--------|-------|
| Squat | 3 | 8-10 | 185 lbs | Focus on depth |
| Bench Press | 4 | 5 | 225 lbs | Pause at bottom |`;
    } catch (error) {
      console.error('Error generating system prompt:', error);
      return `You are an AI fitness coach for the Logday workout app. Your name is Coach.
You provide personalized fitness advice and motivation.

IMPORTANT: Format your responses using markdown. You can use:
- **Bold** and *italic* text for emphasis
- Bullet points and numbered lists for organization
- Tables for structured data (especially for workout plans)
- Headers for section titles`;
    }
  };

  // Send message to OpenAI API
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    try {
      const systemContent = await generateSystemPrompt();
      
      // Convert messages to format expected by OpenAI API
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemContent },
        ...updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];
      
      // Send to OpenAI API
      const response = await openAIService.sendChatCompletion(chatMessages);
      
      if (response) {
        // Add AI response to chat
        const aiMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        };
        
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action button click
  const handleQuickAction = (message: string) => {
    if (message.trim()) {
      sendMessage(message);
    }
  };

  // Handle send button click or Enter key
  const handleSendMessage = () => {
    const message = inputMessage;
    setInputMessage('');
    if (message.trim()) {
      sendMessage(message);
    }
  };

  // Handle key press in textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Create a new conversation
  const startNewConversation = () => {
    setMessages([]);
    setConversationTitle('New Conversation');
    setCurrentConversationId(null);
    navigate('/ai-coach', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-[96px]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between py-2 px-4">
          <div className="flex items-center">
            {currentConversationId && (
              <button 
                onClick={startNewConversation}
                className="mr-3 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-md font-semibold text-gray-800 truncate">
              {conversationTitle}
            </h1>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <DotsThreeVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1">
                <button 
                  onClick={startNewConversation}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  New Conversation
                </button>
                <button 
                  onClick={clearChat}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Clear Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <ChatDots size={32} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">AI Coach</h2>
              <p className="max-w-xs mb-6">
                Ask me anything about workouts, exercises, nutrition, or fitness goals.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm"
                  onClick={() => handleQuickAction("Give me a workout plan for today.")}
                >
                  <Barbell size={18} className="mr-2" />
                  Workout Plan
                </button>
                <button
                  className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm"
                  onClick={() => handleQuickAction("Analyze my workout history and suggest improvements.")}
                >
                  <MagnifyingGlass size={18} className="mr-2" />
                  Analyze History
                </button>
                <button
                  className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm"
                  onClick={() => handleQuickAction("Suggest exercises to improve my bench press.")}
                >
                  <ArrowsOutLineVertical size={18} className="mr-2" />
                  Improve Bench
                </button>
                <button
                  className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm"
                  onClick={() => handleQuickAction("Recommend a protein-rich meal plan.")}
                >
                  <Hamburger size={18} className="mr-2" />
                  Nutrition Tips
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 text-sm`}>
                <div 
                  className={`${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-2xl rounded-br-none' 
                      : 'bg-white border border-gray-200 rounded-2xl rounded-bl-none'
                  } p-4 max-w-[80%]`}
                >
                  {message.role === 'user' ? (
                    <div>{message.content}</div>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Customize heading rendering
                          h1: ({node, ...props}) => <h1 className="text-blue-600 text-xl font-bold mt-4 mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-blue-500 text-lg font-semibold mt-3 mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-blue-400 text-base font-semibold mt-2 mb-1" {...props} />,
                          
                          // Customize list rendering
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
                          li: ({node, ...props}) => <li className="my-1" {...props} />,
                          
                          // Customize table rendering
                          table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="min-w-full" {...props} /></div>,
                          thead: ({node, ...props}) => <thead className="bg-blue-50" {...props} />,
                          th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-medium text-blue-500 uppercase tracking-wider border border-gray-200" {...props} />,
                          td: ({node, ...props}) => <td className="px-3 py-2 text-sm border border-gray-200" {...props} />,
                          
                          // Customize code blocks
                          code: ({node, className, children, ...props}: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !className || !match ? (
                              <code className="bg-gray-100 text-blue-600 px-1 py-0.5 rounded text-sm" {...props}>
                                {children}
                              </code>
                            ) : (
                              <div className="bg-gray-50 rounded-md p-3 my-2 overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </div>
                            );
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area - fixed at bottom */}
      <div className="bg-gray-100 border-t border-gray-200 p-4 safe-bottom z-50">
        {/* Message input */}
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your AI Coach..."
            className="overflow-hidden text-sm flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
            rows={1}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`p-3 rounded-full ${
              !inputMessage.trim() || isLoading
                ? 'bg-gray-200 text-gray-400'
                : 'bg-blue-500 text-white'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <PaperPlaneTilt size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
