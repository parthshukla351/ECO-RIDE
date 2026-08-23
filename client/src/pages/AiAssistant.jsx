import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaPaperPlane, FaVolumeUp, FaVolumeMute, FaShieldAlt, FaQuestionCircle, FaTimes, FaMapMarkerAlt, FaCar, FaWallet } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import AnimatedButton from '../components/ui/AnimatedButton';
import aiService from '../services/aiService';
import api from '../services/api';

const AiAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi! I'm Eco, your Eco-Ride AI assistant. How can I help you navigate your journey today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice Synthesis & Recognition Refs
  const recognitionRef = useRef(null);

  const quickReplies = [
    { text: 'Find a ride', icon: FaMapMarkerAlt, action: 'Find me a ride to Lucknow tomorrow morning' },
    { text: 'My Driver Location', icon: FaCar, action: 'Where is my driver?' },
    { text: 'Wallet Balance', icon: FaWallet, action: 'What is my wallet balance?' },
    { text: 'Unsafe / SOS', icon: FaShieldAlt, action: 'I feel unsafe' },
    { text: 'FAQs / Support', icon: FaQuestionCircle, action: 'How does ID verification work?' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize Web Speech API Speech Recognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputText(transcript);
        handleSend(transcript);
      };

      rec.onerror = () => {
        toast.error('Voice input failed or timed out.');
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend = inputText) => {
    const query = textToSend.trim();
    if (!query) return;

    // Append Passenger Message
    const passengerMsg = {
      id: Date.now().toString(),
      sender: 'passenger',
      text: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, passengerMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Gather current context
      const context = {
        page: location.pathname
      };

      const data = await aiService.chat(query, context);
      
      // Append AI Response
      const aiResponseMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.answer,
        timestamp: new Date(),
        safetyAction: data.safetyAction,
        suggestions: data.suggestions
      };
      setMessages(prev => [...prev, aiResponseMsg]);

      // Handle audio feedback if unmuted
      if (!isMuted) {
        speakText(data.answer);
      }
    } catch (error) {
      toast.error('Failed to communicate with Eco Assistant');
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel previous speech playing
      window.speechSynthesis.cancel();
      // Strip emojis and safety prefix from speech synthesis for clearer vocals
      const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[78vh] flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center text-sm font-black">
            ✨
          </div>
          <div>
            <h1 className="text-xl font-black font-display text-white tracking-tight">Eco Assistant</h1>
            <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Mobility Conversational Copilot</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Mute toggle button */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className="p-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer text-xs"
            title={isMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
        </div>
      </div>

      {/* Messages Pane */}
      <GlassCard hoverable={false} className="flex-1 border-white/5 bg-dark-900/40 p-6 flex flex-col justify-between overflow-y-auto space-y-4 shadow-xl">
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'passenger' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-4 rounded-2xl text-xs font-semibold leading-relaxed border ${
                  msg.sender === 'passenger'
                    ? 'bg-primary-600/10 border-primary-500/20 text-white rounded-br-none'
                    : 'bg-white/5 border-white/5 text-gray-300 rounded-bl-none shadow-md'
                }`}
              >
                <p>{msg.text}</p>
                
                {/* Custom Action Trigger inside Response Bubble */}
                {msg.safetyAction && (
                  <div className="mt-3">
                    <AnimatedButton
                      onClick={() => navigate('/bookings')}
                      variant="primary"
                      className="py-1.5 px-3 bg-red-600 hover:bg-red-500 text-[9px] uppercase tracking-wider font-bold text-white border-red-500/20 shadow-md"
                    >
                      🚨 Open Safety Center
                    </AnimatedButton>
                  </div>
                )}

                {/* Sub-suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          if (sug === 'Open Safety Center') navigate('/bookings');
                          else if (sug === 'Payment History') navigate('/payment-history');
                          else if (sug === 'Go to Wallet') navigate('/wallet');
                          else if (sug === 'Search rides') navigate('/search');
                          else if (sug === 'Carbon Dashboard') navigate('/carbon-analytics');
                          else if (sug === 'Create Support Ticket') {
                            const subject = prompt('Enter a short subject for your support ticket:');
                            if (!subject) return;
                            const description = prompt('Enter the detailed description of your issue:');
                            if (!description) return;
                            api.post('/agents/support/ticket', { category: 'General', subject, description, priority: 'NORMAL' })
                              .then(({ data }) => {
                                toast.success(`Support Ticket ${data.ticketId} successfully registered!`);
                                setMessages(prev => [...prev, {
                                  id: Date.now().toString(),
                                  sender: 'ai',
                                  text: `I have successfully logged a human support ticket (ID: ${data.ticketId}) under category General. Our help representatives will contact you shortly.`,
                                  timestamp: new Date()
                                }]);
                              })
                              .catch(() => toast.error('Failed to register support ticket.'));
                          }
                          else handleSend(sug);
                        }}
                        className="px-2 py-1 bg-white/5 border border-white/5 hover:border-primary-500/20 hover:bg-primary-500/5 text-[9px] text-primary-400 font-bold rounded-lg transition-all cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-bl-none text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && (
          <div className="border-t border-white/5 pt-4 space-y-2">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1">How can I assist?</p>
            <div className="flex flex-wrap gap-2 pr-1">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(reply.action)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 border border-white/5 hover:border-primary-500/25 hover:bg-primary-500/5 rounded-xl text-xs text-gray-300 font-bold hover:text-white transition-all cursor-pointer"
                >
                  <reply.icon className="text-[10px] text-primary-400" />
                  <span>{reply.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Input controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Ask Eco about pricing, route ETA, or location sharing...'}
            disabled={loading || isListening}
            className="input-field bg-dark-900/80 text-sm py-3.5 pr-12"
          />

          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all cursor-pointer text-xs
              ${isListening 
                ? 'bg-red-600 border border-red-500 text-white animate-pulse' 
                : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
              }`}
            title="Voice Speech Input"
          >
            <FaMicrophone />
          </button>
        </div>

        <AnimatedButton
          type="submit"
          variant="primary"
          disabled={loading || !inputText.trim()}
          className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-white flex items-center justify-center shadow-lg"
        >
          <FaPaperPlane />
        </AnimatedButton>
      </form>
    </div>
  );
};

export default AiAssistant;
