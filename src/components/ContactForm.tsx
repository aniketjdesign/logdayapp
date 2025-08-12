import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { OngoingWorkoutMessage } from './others/OngoingWorkoutMessage';

const RedditIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

export const ContactForm: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkout } = useWorkout();
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: '4513d602-309f-49d7-b5ea-6ee8865460ed', // You'll need to replace this
          subject: formData.subject,
          message: formData.description,
          name: formData.name || 'Anonymous',
          from_name: "Message from Logday user!",
          to_email: "hello@logday.app",
          email: user?.email || 'No email provided'
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ subject: '', description: '', name: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {currentWorkout && <OngoingWorkoutMessage />}
      
      <div className="mx-auto px-4 py-6">
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">Contact Us</h1>
        <p className="text-gray-600 text-sm pr-6">I'd love to hear about your Logday experience. Drop a message/feedback and I'll respond as soon as possible.</p>
      </motion.div>
      

      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            required
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter subject"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
            placeholder="Enter your message"
          />
        </div>

        

        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            Message sent successfully! I'll get back to you soon.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            Failed to send message. Please try again later or reach out <a href="mailto:hello@logday.app" className="text-blue-600 hover:text-blue-800 underline">directly</a>.
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium space-x-2
            ${isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
          <Send size={18} />
          <span>{isSubmitting ? 'Sending...' : 'Send'}</span>
        </button>
      </motion.form>

      <motion.div 
        className="mt-8 flex justify-center space-x-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <a 
          href="https://www.reddit.com/r/logdayapp" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
        >
          <RedditIcon />
          <span>r/logdayapp</span>
        </a>
        <a 
          href="mailto:hello@logday.app"
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
        >
          <Mail size={18} />
          <span>hello@logday.app</span>
        </a>
      </motion.div>
      </div>
    </motion.div>

  );
};
