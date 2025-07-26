import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { aiCoachService, ChatMessage } from '../../services/aiCoachService';
import { Bot, User, MessageCircle, Calendar, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Conversation {
  id: string;
  created_at: string;
  message_count: number;
  last_message: string;
  last_activity: string;
}

interface ConversationHistoryProps {
  onSelectConversation: (conversationId: string, messages: ChatMessage[]) => void;
  currentConversationId: string;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  onSelectConversation,
  currentConversationId
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string>(currentConversationId);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    setSelectedConversation(currentConversationId);
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      if (!user) return;
      
      const conversationsList = await aiCoachService.getConversations(user.id);
      setConversations(conversationsList);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      setSelectedConversation(conversationId);
      const messages = await aiCoachService.getConversationHistory(conversationId);
      onSelectConversation(conversationId, messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      if (!user) return;
      
      const newConversationId = await aiCoachService.createConversation(user.id);
      await loadConversations();
      
      // Switch to the new empty conversation
      onSelectConversation(newConversationId, []);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
          </div>
          <button
            onClick={loadConversations}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <button
          onClick={createNewConversation}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Start New Conversation
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <RefreshCw size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              Start your first conversation with the AI Coach
            </p>
          </div>
        ) : (
          <div className="p-2">
            <AnimatePresence>
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 border ${
                    selectedConversation === conversation.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(conversation.last_activity)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {conversation.message_count} messages
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 truncate">
                        {conversation.last_message || 'New conversation'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};