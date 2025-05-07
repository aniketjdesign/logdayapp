import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { supabaseService } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';
import { ChatDots, Trash, CaretRight } from 'phosphor-react';
import { motion } from 'framer-motion';

interface ConversationPreview {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
}

export const AICoachHistory: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load conversation history
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseService.getAICoachConversations();
      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await supabaseService.deleteAICoachConversation(id);
      setConversations(conversations.filter(conv => conv.id !== id));
      setShowDeleteConfirm(false);
      setSelectedConversation(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Within the last week
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return `${date.toLocaleDateString([], { weekday: 'long' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Older
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageHeader 
        title={
          <div className="flex items-center">
            <ChatDots size={24} className="mr-2 text-blue-500" />
            <span>Conversation History</span>
          </div>
        }
        scrollContainerRef={scrollContainerRef}
      />
      
      <div className="flex-1 p-4" ref={scrollContainerRef}>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-blue-50 p-4 rounded-full inline-block mb-4">
              <ChatDots size={32} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
            <p className="text-gray-500 mb-6">Start a new conversation with your AI Coach</p>
            <button
              onClick={() => navigate('/ai-coach')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              New Conversation
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-700">Your conversations</h2>
              <button
                onClick={() => navigate('/ai-coach')}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                New Conversation
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="border-b border-gray-100 last:border-b-0">
                  <motion.div 
                    className={`p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer ${
                      selectedConversation === conversation.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (selectedConversation === conversation.id) {
                        navigate(`/ai-coach/${conversation.id}`);
                      } else {
                        setSelectedConversation(conversation.id);
                      }
                    }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{conversation.title}</h3>
                      <p className="text-xs text-gray-500">{formatDate(conversation.last_message_at)}</p>
                    </div>
                    <div className="flex items-center">
                      {selectedConversation === conversation.id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash size={16} />
                          </button>
                          <CaretRight size={16} className="text-gray-400" />
                        </>
                      ) : (
                        <CaretRight size={16} className="text-gray-400" />
                      )}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Conversation</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this conversation? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConversation(selectedConversation)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
