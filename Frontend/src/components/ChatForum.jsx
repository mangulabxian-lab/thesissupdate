import { useState, useEffect, useRef } from 'react';
import { 
  getClassChatMessages,
  sendClassChatMessage 
} from '../lib/api';
import io from 'socket.io-client';
import './ChatForum.css';

export default function ChatForum({ classId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getInitials = (name = "") => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // ✅ FIXED: Generate avatar URL for ALL users
  const getAvatarUrl = (user) => {
    if (!user) return null;
    
    // If user has profile image, use it
    if (user.profileImage) {
      return user.profileImage;
    }
    
    // ✅ FIX: Generate avatar for users without profile images
    if (user.name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&size=96`;
    }
    
    // Fallback for unknown users
    return `https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=96`;
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'Unknown User';
    return user.name || user.userName || user.email || 'Unknown User';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!classId) return;
    
    try {
      setLoading(true);
      const response = await getClassChatMessages(classId);
      
      if (response.success) {
        const enhancedMessages = (response.data || []).map(msg => ({
          ...msg,
          userId: msg.userId || msg.sender,
          userName: getUserDisplayName(msg.userId || msg.sender),
          userRole: msg.userRole || (msg.userId?.role || msg.sender?.role)
        }));
        
        setMessages(enhancedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageViaAPI = async (messageText) => {
    try {
      const response = await sendClassChatMessage(classId, {
        message: messageText
      });
      return response;
    } catch (error) {
      console.error('❌ API send failed:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      handleTypingStop();

      if (socketRef.current && socketConnected) {
        socketRef.current.emit("send-chat-message", {
          classId,
          message: newMessage.trim(),
          userData: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            profileImage: currentUser.profileImage,
            role: currentUser.role
          }
        });
      } else {
        await sendMessageViaAPI(newMessage.trim());
      }

      setNewMessage('');
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      if (socketRef.current && socketConnected) {
        socketRef.current.emit("delete-chat-message", {
          messageId,
          classId
        });
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleTypingStart = () => {
    if (socketRef.current && socketConnected) {
      socketRef.current.emit("typing-start", { 
        classId,
        userData: {
          id: currentUser.id,
          name: currentUser.name
        }
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 3000);
    }
  };

  const handleTypingStop = () => {
    if (socketRef.current && socketConnected) {
      socketRef.current.emit("typing-stop", { 
        classId,
        userId: currentUser.id
      });
    }
  };

  // ✅ FIXED: Simple reliable Avatar component
  const Avatar = ({ user, size = 40 }) => {
    const avatarUrl = getAvatarUrl(user);
    
    return (
      <div className="avatar" style={{ width: size, height: size }}>
        <img 
          src={avatarUrl} 
          alt={`${user?.name || 'User'}'s avatar`}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => {
            // Fallback if image fails to load
            e.target.src = `https://ui-avatars.com/api/?name=${getInitials(user?.name)}&background=667eea&color=fff&size=96`;
          }}
        />
      </div>
    );
  };

  // Socket.io connection and event handlers
  useEffect(() => {
    if (!classId || !currentUser) return;

    const token = localStorage.getItem('token');
    
    const socket = io("http://localhost:3000", {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join-class-chat', { 
        classId,
        userData: currentUser
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setSocketConnected(false);
    });

    socket.on('chat-history', (history) => {
      const enhancedHistory = (history || []).map(msg => ({
        ...msg,
        userId: msg.userId || msg.sender,
        userName: getUserDisplayName(msg.userId || msg.sender),
        userRole: msg.userRole || (msg.userId?.role || msg.sender?.role)
      }));
      setMessages(enhancedHistory);
    });

    socket.on('new-chat-message', (message) => {
      const enhancedMessage = {
        ...message,
        userId: message.userId || message.sender,
        userName: getUserDisplayName(message.userId || message.sender),
        userRole: message.userRole || (message.userId?.role || message.sender?.role)
      };

      setMessages(prev => {
        if (prev.some(m => m._id === enhancedMessage._id)) return prev;
        return [...prev, enhancedMessage];
      });
    });

    socket.on('message-deleted', (data) => {
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    });

    socket.on('user-typing', (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return data.isTyping ? [...filtered, data] : filtered;
      });
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      alert(error.message || 'Chat error occurred');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-class-chat', { classId });
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [classId, currentUser]);

  useEffect(() => {
    if (classId) {
      loadMessages();
    }
  }, [classId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const canDeleteMessage = (msg) =>
    currentUser?.id === msg.userId?._id || currentUser?.role === 'teacher';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!classId) {
    return (
      <div className="chat-wrapper">
        <div className="no-class-selected">
          <p>Please select a class to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
        {socketConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div className="messages-area">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isDeleted) return null;
            
            const isOwn = currentUser?.id === msg.userId?._id;
            const displayName = getUserDisplayName(msg.userId);
            const userRole = msg.userRole;

            return (
              <div key={msg._id} className={`msg-row ${isOwn ? "own" : "other"}`}>
                {!isOwn && <Avatar user={msg.userId} />}

                <div className={`bubble ${isOwn ? "blue" : "grey"}`}>
                  <div className="message-header">
                    <span className="sender-name">
                      {displayName}
                      {userRole === 'teacher' && ' 👨‍🏫'}
                    </span>
                  </div>
                  <div className="bubble-text">{msg.message}</div>
                  <div className="bubble-time">
                    {formatTime(msg.createdAt || msg.timestamp)}
                    {canDeleteMessage(msg) && (
                      <button 
                        className="delete-message-btn"
                        onClick={() => handleDeleteMessage(msg._id)}
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {isOwn && <Avatar user={currentUser} />}
              </div>
            );
          })
        )}

        {typingUsers.length > 0 && (
          <div className="typing-row">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            <div className="typing-name">
              {typingUsers.map(u => u.userName).join(", ")} typing…
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      <form onSubmit={handleSendMessage} className="input-area">
        <input 
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (e.target.value.trim()) {
              handleTypingStart();
            } else {
              handleTypingStop();
            }
          }}
          className="chat-input"
          disabled={sending}
        />
        <button 
          className="send-btn" 
          disabled={!newMessage.trim() || sending}
          type="submit"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}