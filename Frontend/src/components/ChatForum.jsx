import { useState, useEffect, useRef } from 'react';
import { 
  getClassChatMessages,
  sendClassChatMessage 
} from '../lib/api';
import io from 'socket.io-client';
import './ChatForum.css';

export default function ChatForum({ classId, currentUser, classMembers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ✅ IMPROVED: Enhanced user profile finder with better fallbacks
  const findUserProfile = (userId, userName) => {
    if (!classMembers) {
      console.log('❌ classMembers is null/undefined');
      return null;
    }
    
    console.log('🔍 Searching for user profile:', { userId, userName });
    
    // Check all teachers
    if (classMembers.teachers && classMembers.teachers.length > 0) {
      const teacher = classMembers.teachers.find(t => 
        t._id === userId || t.userId === userId || t.name === userName
      );
      if (teacher) {
        console.log('👨‍🏫 Found teacher profile:', teacher.name, teacher.profileImage);
        return teacher.profileImage || teacher.avatar;
      }
    }
    
    // Check all students  
    if (classMembers.students && classMembers.students.length > 0) {
      const student = classMembers.students.find(s => 
        s._id === userId || s.userId === userId || s.name === userName
      );
      if (student) {
        console.log('👨‍🎓 Found student profile:', student.name, student.profileImage);
        return student.profileImage || student.avatar;
      }
    }
    
    console.log('❌ No profile found in class members for:', userName);
    return null;
  };

  const getInitials = (name = "") => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // ✅ IMPROVED: Enhanced avatar URL function with multiple fallbacks
  const getAvatarUrl = (user) => {
    if (!user) {
      console.log('❌ No user data provided');
      return `https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=96`;
    }
    
    console.log('👤 Avatar user data:', {
      id: user._id || user.id,
      name: user.name || user.userName,
      profileImage: user.profileImage,
      hasProfileImage: !!user.profileImage
    });

    // ✅ 1. Check user's own profile image
    if (user.profileImage && user.profileImage.trim() !== '') {
      console.log('✅ Using user profile image');
      return user.profileImage;
    }
    
    // ✅ 2. Check populated user data
    if (user.userId && user.userId.profileImage && user.userId.profileImage.trim() !== '') {
      console.log('✅ Using populated user profile image');
      return user.userId.profileImage;
    }
    
    // ✅ 3. Check if profileImage is stored directly in message
    if (user.profileImage && user.profileImage.trim() !== '') {
      console.log('✅ Using direct message profile image');
      return user.profileImage;
    }
    
    // ✅ 4. NEW: Check Dashboard's class members data
    const userId = user._id || user.id || (user.userId && user.userId._id);
    const userName = user.name || user.userName || (user.userId && user.userId.name);
    
    if (userId || userName) {
      const dashboardProfile = findUserProfile(userId, userName);
      if (dashboardProfile) {
        console.log('🎯 FOUND PROFILE IN DASHBOARD DATA:', dashboardProfile);
        return dashboardProfile;
      }
    }
    
    // ✅ 5. Fallback to generated avatar
    if (userName) {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=667eea&color=fff&size=96`;
      console.log('🔄 Using generated avatar:', avatarUrl);
      return avatarUrl;
    }
    
    // Final fallback
    console.log('❌ No profile found, using default avatar');
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
        
        console.log('💬 Loaded messages with user data:', enhancedMessages.map(m => ({
          id: m._id,
          userName: m.userName,
          userId: m.userId?._id,
          profileImage: m.userId?.profileImage,
          hasProfileImage: !!m.userId?.profileImage
        })));
        
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

  // ✅ IMPROVED: Enhanced Avatar component with better error handling
  const Avatar = ({ user, size = 40 }) => {
    const [avatarError, setAvatarError] = useState(false);
    const avatarUrl = getAvatarUrl(user);
    const displayName = getUserDisplayName(user);
    const initials = getInitials(displayName);
    
    console.log('🖼️ Avatar rendering:', {
      userName: displayName,
      avatarUrl: avatarUrl,
      userData: user
    });
    
    const handleImageError = () => {
      console.log('❌ Avatar image failed to load:', avatarUrl);
      setAvatarError(true);
    };

    return (
      <div className="avatar" style={{ width: size, height: size }}>
        {!avatarError && avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={`${displayName}'s avatar`}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              display: 'block'
            }}
            onError={handleImageError}
          />
        ) : (
          <div className="avatar-fallback">
            {initials}
          </div>
        )}
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

      console.log('💬 New message received:', {
        messageId: enhancedMessage._id,
        userName: enhancedMessage.userName,
        userId: enhancedMessage.userId?._id,
        profileImage: enhancedMessage.userId?.profileImage,
        hasProfileImage: !!enhancedMessage.userId?.profileImage
      });

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
            
            // ✅ FIXED: Enhanced user data handling
            const userData = msg.userId || msg.sender || {
              _id: msg.userId?._id,
              name: msg.userName,
              profileImage: msg.profileImage,
              role: msg.userRole
            };
            
            const displayName = getUserDisplayName(userData);
            const userRole = msg.userRole || userData.role;

            console.log('💬 Message user data:', {
              messageId: msg._id,
              userName: displayName,
              userData: userData,
              profileImage: userData.profileImage,
              isOwn: isOwn
            });

            return (
              <div key={msg._id} className={`msg-row ${isOwn ? "own" : "other"}`}>
                {!isOwn && <Avatar user={userData} />}

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