const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/ChatMessage");
const Class = require("../models/Class");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Get chat messages for a class - ✅ FIXED PROFILE IMAGE POPULATION
router.get("/:classId/messages", authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 100 } = req.query;

    console.log('📨 Fetching messages for class:', classId);

    // Check if user has access to this class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ 
        success: false,
        message: "Class not found" 
      });
    }

    const isMember = classData.ownerId.toString() === req.user.id || 
                    classData.members.some(m => m.userId.toString() === req.user.id);
    
    if (!isMember) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied" 
      });
    }

    // ✅ FIXED: Enhanced population to ensure profile images are included
    const messages = await ChatMessage.find({ 
      classId, 
      isDeleted: false 
    })
      .populate({
        path: "userId",
        select: "name email profileImage role",
        model: "User"
      })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit));

    console.log(`✅ Found ${messages.length} messages for class ${classId}`);
    
    // ✅ ENHANCED DEBUG: Check profile images for ALL messages
    messages.forEach((msg, index) => {
      console.log(`👤 Message ${index + 1}:`, {
        userName: msg.userId?.name,
        userId: msg.userId?._id,
        profileImage: msg.userId?.profileImage,
        hasProfileImage: !!msg.userId?.profileImage,
        populatedUser: !!msg.userId
      });
    });

    res.json({
      success: true,
      data: messages,
      total: messages.length
    });
  } catch (err) {
    console.error("❌ Get chat messages error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch chat messages" 
    });
  }
});

// Send a new message (REST API fallback) - ✅ FIXED PROFILE IMAGE
router.post("/:classId/messages", authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    console.log('💬 REST API message send:', { classId, message, userId });

    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        success: false,
        message: "Message cannot be empty" 
      });
    }

    // Check class access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ 
        success: false,
        message: "Class not found" 
      });
    }

    const isMember = classData.ownerId.toString() === userId || 
                    classData.members.some(m => m.userId.toString() === userId);
    
    if (!isMember) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied" 
      });
    }

    // Determine user role
    let userRole = "student";
    if (classData.ownerId.toString() === userId) {
      userRole = "teacher";
    } else {
      const member = classData.members.find(m => 
        m.userId.toString() === userId && m.role === "teacher"
      );
      if (member) userRole = "teacher";
    }

    // ✅ FIXED: Get fresh user data with profile image from database
    const userWithProfile = await User.findById(userId).select('name email profileImage role');
    
    if (!userWithProfile) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    console.log('🖼️ User profile data from DB:', {
      name: userWithProfile.name,
      profileImage: userWithProfile.profileImage,
      role: userWithProfile.role
    });

    // Create message with guaranteed profile image
    const newMessage = await ChatMessage.create({
      classId,
      userId,
      userName: userWithProfile.name,
      userRole,
      profileImage: userWithProfile.profileImage, // ✅ Store profile image directly
      message: message.trim()
    });

    // ✅ FIXED: Enhanced population for immediate response
    const populatedMessage = await ChatMessage.findById(newMessage._id)
      .populate({
        path: "userId",
        select: "name email profileImage role",
        model: "User"
      });

    console.log('✅ Message created via REST API:', {
      id: populatedMessage._id,
      userName: populatedMessage.userName,
      profileImage: populatedMessage.profileImage,
      userProfileImage: populatedMessage.userId?.profileImage,
      userRole: populatedMessage.userRole
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage
    });
  } catch (err) {
    console.error("❌ Send message error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to send message" 
    });
  }
});

// Delete a message
router.delete("/messages/:messageId", authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await ChatMessage.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "Message not found" 
      });
    }

    // Check permissions
    const classData = await Class.findById(message.classId);
    const isTeacher = classData.ownerId.toString() === userId || 
                     classData.members.some(m => 
                       m.userId.toString() === userId && m.role === "teacher"
                     );

    if (message.userId.toString() !== userId && !isTeacher) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this message" 
      });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (err) {
    console.error("❌ Delete message error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete message" 
    });
  }
});

module.exports = router;