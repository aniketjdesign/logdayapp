// OpenAI API service for Logday AI Coach

// Interface for chat messages
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

import axios from 'axios';

export const openAIService = {
  /**
   * Send a chat completion request to OpenAI API
   * @param messages Array of messages in the conversation
   * @returns The assistant's response text
   */
  async sendChatCompletion(messages: ChatMessage[]): Promise<string> {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages,
          temperature: 0.7,
          max_tokens: 1500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
};
