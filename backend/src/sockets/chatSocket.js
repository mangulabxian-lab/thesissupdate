const ChatMessage = require('../models/ChatMessage');
const Class = require('../models/Class');
const User = require('../models/user');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected to chat:', socket.id);

    // Join class chat room
    socket.on('join-class-chat', async (data) => {
      try {
        const { classId } = data;
        socket.join(`class_${classId}`);
        console.log(`📨 User joined class chat: class_${classId}`);
        
        // Send chat history
        const messages = await ChatMessage.find({ 
          classId, 
          isDeleted: false 
        })
        .populate('userId', 'name email profileImage')
        .sort({ createdAt: 1 })
        .limit(100);
        
        socket.emit('chat-history', messages);
      } catch (error) {
        console.error('Join class chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Send new message
    socket.on('send-chat-message', async (data) => {
      try {
        const { classId, message } = data;
        const userId = socket.userId;

        console.log('💬 New message attempt:', { classId, message, userId });

        if (!userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        const classData = await Class.findById(classId);
        if (!classData) {
          socket.emit('error', { message: 'Class not found' });
          return;
        }

        // Determine user role
        let userRole = "student";
        if (classData.ownerId.toString() === userId.toString()) {
          userRole = "teacher";
        } else {
          const member = classData.members.find(m => 
            m.userId.toString() === userId.toString() && m.role === "teacher"
          );
          if (member) userRole = "teacher";
        }

        // Create new message
        const newMessage = new ChatMessage({
          classId,
          userId,
          userName: user.name,
          userRole,
          message: message.trim()
        });

        await newMessage.save();
        
        // Populate the message for sending to clients
        const populatedMessage = await ChatMessage.findById(newMessage._id)
          .populate('userId', 'name email profileImage');

        console.log('✅ Message saved:', populatedMessage);

        // Broadcast to all in class
        io.to(`class_${classId}`).emit('new-chat-message', populatedMessage);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Delete message
    socket.on('delete-chat-message', async (data) => {
      try {
        const { messageId, classId } = data;
        const userId = socket.userId;

        const message = await ChatMessage.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check permissions
        const classData = await Class.findById(classId);
        const isTeacher = classData.ownerId.toString() === userId || 
                         classData.members.some(m => 
                           m.userId.toString() === userId && m.role === "teacher"
                         );

        if (message.userId.toString() !== userId && !isTeacher) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Soft delete
        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        io.to(`class_${classId}`).emit('message-deleted', { messageId });

      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Typing indicators
    socket.on('typing-start', (data) => {
      const { classId } = data;
      socket.to(`class_${classId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: true
      });
    });

    socket.on('typing-stop', (data) => {
      const { classId } = data;
      socket.to(`class_${classId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: false
      });
    });

    // Leave class chat
    socket.on('leave-class-chat', (data) => {
      const { classId } = data;
      socket.leave(`class_${classId}`);
      console.log(` User left class chat: class_${classId}`);
    });

    socket.on('disconnect', () => {
      console.log(' User disconnected from chat:', socket.id);
    });
  });
};