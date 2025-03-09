
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

const UserChat = () => {
  const { sendMessage, getMessagesByUser, getUnreadMessagesCount, markMessagesAsRead } = useChat();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = user ? getMessagesByUser('1') : []; // Get messages with admin
  const unreadCount = getUnreadMessagesCount();
  
  // Set initial position at bottom right corner
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPosition = localStorage.getItem('chatPosition');
      if (storedPosition) {
        setPosition(JSON.parse(storedPosition));
      } else {
        setPosition({
          x: window.innerWidth - 80,
          y: window.innerHeight - 80,
        });
      }
    }
  }, []);
  
  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chatPosition', JSON.stringify(position));
  }, [position]);
  
  // Scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);
  
  // Mark messages as read when chat opens
  useEffect(() => {
    if (isOpen && user) {
      const unreadMessageIds = messages
        .filter(msg => msg.receiverId === user.id && !msg.read)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds);
      }
    }
  }, [isOpen, messages, user]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chatRef.current || isOpen) return;
    
    setIsDragging(true);
    const rect = chatRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Ensure the chat stays within the viewport
    const maxX = window.innerWidth - (chatRef.current?.offsetWidth || 60);
    const maxY = window.innerHeight - (chatRef.current?.offsetHeight || 60);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;
    
    sendMessage(message);
    setMessage('');
  };
  
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  return (
    <div
      ref={chatRef}
      className={`fixed z-40 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {isOpen ? (
        <div 
          className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-3 border-b bg-cartus-primary text-white rounded-t-lg">
            <h3 className="font-medium">Chat with Admin</h3>
            <Button variant="ghost" size="icon" className="text-white hover:bg-cartus-primary/90" onClick={toggleChat}>
              <X size={18} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.senderId === user?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[80%] ${
                      msg.senderId === user?.id
                        ? 'bg-cartus-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="border-t p-3 flex gap-2">
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={!isAuthenticated}
            />
            <Button 
              type="submit" 
              size="icon"
              className="bg-cartus-primary hover:bg-cartus-primary/90"
              disabled={!isAuthenticated || !message.trim()}
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      ) : (
        <button
          className="bg-cartus-primary text-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:bg-cartus-primary/90 transition-colors relative"
          onClick={toggleChat}
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </button>
      )}
    </div>
  );
};

export default UserChat;
