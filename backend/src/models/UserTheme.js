const mongoose = require('mongoose');

const UserThemeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'blue', 'green', 'custom'],
    default: 'light'
  },
  customColors: {
    primary: String,
    secondary: String,
    background: String,
    surface: String,
    text: String,
    textSecondary: String,
    border: String
  },
  typography: {
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'xlarge'],
      default: 'medium'
    },
    fontFamily: {
      type: String,
      enum: ['system', 'inter', 'roboto', 'open-sans', 'montserrat'],
      default: 'system'
    },
    highContrast: {
      type: Boolean,
      default: false
    }
  },
  layout: {
    density: {
      type: String,
      enum: ['comfortable', 'compact'],
      default: 'comfortable'
    },
    sidebarPosition: {
      type: String,
      enum: ['left', 'right'],
      default: 'left'
    }
  },
  roleSpecific: {
    // Teacher-specific settings
    teacher: {
      proctoringView: {
        type: String,
        enum: ['detailed', 'compact'],
        default: 'detailed'
      },
      alertPriority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'high'
      },
      gradebookColors: {
        type: String,
        enum: ['gradient', 'solid', 'minimal'],
        default: 'gradient'
      }
    },
    // Student-specific settings
    student: {
      examInterface: {
        type: String,
        enum: ['minimal', 'standard', 'accessible'],
        default: 'standard'
      },
      focusMode: {
        type: Boolean,
        default: false
      },
      readingMode: {
        type: String,
        enum: ['normal', 'dyslexia-friendly', 'high-contrast'],
        default: 'normal'
      }
    }
  },
  syncAcrossDevices: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
UserThemeSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Index for faster queries
UserThemeSchema.index({ userId: 1 });
UserThemeSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('UserTheme', UserThemeSchema);