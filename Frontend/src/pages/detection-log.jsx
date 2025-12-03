// detection-log.jsx
import React, { useState, useEffect } from 'react';
import './DetectionLog.css'; // We'll create this CSS file

export default function DetectionLog({ 
  proctoringAlerts, 
  students,
  studentAttempts,
  onClearAlerts,
  onDismissAlert 
}) {
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDetails, setExpandedDetails] = useState({});

  // Convert alerts object to array
  useEffect(() => {
    let allAlerts = [];
    
    // Convert object to array
    Object.keys(proctoringAlerts).forEach(studentSocketId => {
      const studentAlerts = proctoringAlerts[studentSocketId] || [];
      const student = students.find(s => s.socketId === studentSocketId);
      
      studentAlerts.forEach(alert => {
        allAlerts.push({
          ...alert,
          studentSocketId,
          studentName: student?.name || 'Unknown Student',
          studentId: student?.studentId || studentSocketId,
          timestamp: alert.timestamp || new Date().toLocaleString()
        });
      });
    });

    // Apply filters
    let filtered = allAlerts;

    // Filter by student
    if (selectedStudent !== 'all') {
      filtered = filtered.filter(alert => alert.studentSocketId === selectedStudent);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(alert => {
        const detectionType = alert.detectionType?.toLowerCase() || '';
        const message = alert.message?.toLowerCase() || '';
        
        switch(selectedType) {
          case 'tab_switch':
            return detectionType.includes('tab') || message.includes('tab');
          case 'audio':
            return detectionType.includes('audio') || message.includes('audio') || message.includes('mic');
          case 'face':
            return detectionType.includes('face') || detectionType.includes('gaze') || 
                   message.includes('face') || message.includes('gaze');
          case 'gesture':
            return detectionType.includes('gesture') || message.includes('hand') || 
                   message.includes('gesture');
          case 'screenshot':
            return detectionType.includes('screenshot') || message.includes('screenshot');
          case 'python':
            return detectionType.includes('python') || message.includes('python');
          case 'violation':
            return alert.type === 'danger' || alert.severity === 'high';
          default:
            return true;
        }
      });
    }

    // Filter by time range
    if (timeRange !== 'all') {
      const now = new Date();
      let timeLimit = new Date();
      
      switch(timeRange) {
        case 'last5min':
          timeLimit.setMinutes(now.getMinutes() - 5);
          break;
        case 'last30min':
          timeLimit.setMinutes(now.getMinutes() - 30);
          break;
        case 'lastHour':
          timeLimit.setHours(now.getHours() - 1);
          break;
        case 'today':
          timeLimit.setHours(0, 0, 0, 0);
          break;
        default:
          timeLimit = new Date(0); // Beginning of time
      }
      
      filtered = filtered.filter(alert => {
        const alertTime = new Date(alert.timestamp || alert.id.split('_')[1]);
        return alertTime >= timeLimit;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.message.toLowerCase().includes(query) ||
        alert.studentName.toLowerCase().includes(query) ||
        (alert.detectionType && alert.detectionType.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.id.split('_')[1]);
      const timeB = new Date(b.timestamp || b.id.split('_')[1]);
      
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

    setFilteredAlerts(filtered);
  }, [proctoringAlerts, students, selectedStudent, selectedType, timeRange, sortBy, searchQuery]);

  // Get detection type icon
  const getDetectionIcon = (detectionType) => {
    if (!detectionType) return '⚠️';
    
    switch(detectionType.toLowerCase()) {
      case 'tab_switching':
      case 'tab_switch':
        return '💻';
      case 'audio_detection':
      case 'audio_anomaly':
        return '🎤';
      case 'face_detection':
      case 'no_face':
        return '👁️';
      case 'gaze_detection':
        return '👀';
      case 'gesture_detection':
        return '🤚';
      case 'screenshot_detection':
        return '📸';
      case 'python_detection':
        return '🐍';
      case 'multiple_people':
        return '👥';
      case 'mobile_phone':
        return '📱';
      default:
        return '⚠️';
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'high':
        return <span className="severity-badge high">HIGH</span>;
      case 'medium':
        return <span className="severity-badge medium">MEDIUM</span>;
      case 'low':
        return <span className="severity-badge low">LOW</span>;
      default:
        return <span className="severity-badge unknown">UNKNOWN</span>;
    }
  };

  // Get alert type color
  const getAlertTypeClass = (type, detectionType) => {
    if (type === 'danger') return 'danger-alert';
    if (detectionType?.includes('tab_switch')) return 'tab-alert';
    if (detectionType?.includes('python')) return 'python-alert';
    if (type === 'warning') return 'warning-alert';
    return 'info-alert';
  };

  // Toggle expanded details
  const toggleDetails = (alertId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [alertId]: !prev[alertId]
    }));
  };

  // Get student attempts info
  const getStudentAttempts = (studentSocketId) => {
    return studentAttempts[studentSocketId] || {
      currentAttempts: 0,
      maxAttempts: 10,
      attemptsLeft: 10,
      history: []
    };
  };

  // Calculate statistics
  const calculateStats = () => {
    const stats = {
      totalAlerts: filteredAlerts.length,
      uniqueStudents: new Set(filteredAlerts.map(a => a.studentSocketId)).size,
      byType: {},
      bySeverity: {},
      timeline: []
    };

    filteredAlerts.forEach(alert => {
      // Count by type
      const type = alert.detectionType || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by severity
      const severity = alert.severity || 'unknown';
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    });

    // Timeline (last 24 hours grouped by hour)
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(now.getHours() - i);
      const hourStart = new Date(hour);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hour);
      hourEnd.setMinutes(59, 59, 999);
      
      const hourAlerts = filteredAlerts.filter(alert => {
        const alertTime = new Date(alert.timestamp || alert.id.split('_')[1]);
        return alertTime >= hourStart && alertTime <= hourEnd;
      });
      
      stats.timeline.push({
        hour: hour.getHours(),
        count: hourAlerts.length
      });
    }

    return stats;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Student Name', 'Alert Type', 'Message', 'Severity', 'Timestamp', 'Confidence', 'Source'];
    
    const csvRows = [
      headers.join(','),
      ...filteredAlerts.map(alert => [
        `"${alert.studentName.replace(/"/g, '""')}"`,
        `"${alert.detectionType || 'N/A'}"`,
        `"${alert.message.replace(/"/g, '""')}"`,
        `"${alert.severity || 'N/A'}"`,
        `"${alert.timestamp}"`,
        `"${alert.confidence || 'N/A'}"`,
        `"${alert.source || 'N/A'}"`
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detection-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const stats = calculateStats();

  return (
    <div className="detection-log">
      {/* Header */}
      <div className="detection-log-header">
        <h2>📊 Detection Log</h2>
        <div className="log-actions">
          <button 
            className="export-btn"
            onClick={exportToCSV}
            disabled={filteredAlerts.length === 0}
          >
            📥 Export CSV
          </button>
          <button 
            className="clear-all-btn"
            onClick={() => onClearAlerts && onClearAlerts()}
            disabled={Object.keys(proctoringAlerts).length === 0}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="stats-summary">
        <div className="stat-card total-alerts">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalAlerts}</div>
            <div className="stat-label">Total Alerts</div>
          </div>
        </div>
        
        <div className="stat-card unique-students">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.uniqueStudents}</div>
            <div className="stat-label">Students with Alerts</div>
          </div>
        </div>
        
        <div className="stat-card high-severity">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-number">{stats.bySeverity.high || 0}</div>
            <div className="stat-label">High Severity</div>
          </div>
        </div>
        
        <div className="stat-card tab-switches">
          <div className="stat-icon">💻</div>
          <div className="stat-content">
            <div className="stat-number">{stats.byType.tab_switching || stats.byType.tab_switch || 0}</div>
            <div className="stat-label">Tab Switches</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="log-filters">
        <div className="filter-group">
          <label>Student:</label>
          <select 
            value={selectedStudent} 
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="all">All Students</option>
            {students.map(student => (
              <option key={student.socketId} value={student.socketId}>
                {student.name} ({getStudentAttempts(student.socketId).currentAttempts} violations)
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Type:</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="tab_switch">💻 Tab Switch</option>
            <option value="audio">🎤 Audio</option>
            <option value="face">👁️ Face Detection</option>
            <option value="gesture">🤚 Gesture</option>
            <option value="screenshot">📸 Screenshot</option>
            <option value="python">🐍 Python Detection</option>
            <option value="violation">🚨 Violations</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Time:</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="last5min">Last 5 Minutes</option>
            <option value="last30min">Last 30 Minutes</option>
            <option value="lastHour">Last Hour</option>
            <option value="today">Today</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sort:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        
        <div className="filter-group search-filter">
          <label>Search:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
          />
        </div>
      </div>

      {/* Alerts Table */}
      <div className="alerts-table-container">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts-message">
            <div className="empty-state-icon">📭</div>
            <h3>No alerts found</h3>
            <p>Try adjusting your filters or wait for new alerts to appear.</p>
          </div>
        ) : (
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Student</th>
                <th>Type</th>
                <th>Message</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert, index) => {
                const attempts = getStudentAttempts(alert.studentSocketId);
                
                return (
                  <React.Fragment key={alert.id || index}>
                    <tr className={`alert-row ${getAlertTypeClass(alert.type, alert.detectionType)}`}>
                      <td className="timestamp-cell">
                        <div className="time-display">
                          {alert.timestamp?.split(' ')[1] || 'N/A'}
                        </div>
                        <div className="date-display">
                          {alert.timestamp?.split(' ')[0] || ''}
                        </div>
                      </td>
                      
                      <td className="student-cell">
                        <div className="student-info">
                          <span className="student-name">{alert.studentName}</span>
                          <div className="student-extra">
                            <span className="attempts-badge">
                              Violations: {attempts.currentAttempts}/{attempts.maxAttempts}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="type-cell">
                        <div className="type-content">
                          <span className="type-icon">
                            {getDetectionIcon(alert.detectionType)}
                          </span>
                          <span className="type-text">
                            {alert.detectionType?.replace(/_/g, ' ') || 'Alert'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="message-cell">
                        <div className="message-preview">
                          {alert.message.length > 100 
                            ? `${alert.message.substring(0, 100)}...`
                            : alert.message
                          }
                        </div>
                        <button 
                          className="expand-btn"
                          onClick={() => toggleDetails(alert.id || index)}
                        >
                          {expandedDetails[alert.id || index] ? '▲' : '▼'}
                        </button>
                      </td>
                      
                      <td className="severity-cell">
                        {getSeverityBadge(alert.severity)}
                      </td>
                      
                      <td className="confidence-cell">
                        {alert.confidence ? (
                          <div className="confidence-bar">
                            <div 
                              className="confidence-fill"
                              style={{ width: `${alert.confidence}%` }}
                            ></div>
                            <span className="confidence-text">
                              {Math.round(alert.confidence)}%
                            </span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      
                      <td className="actions-cell">
                        <button 
                          className="dismiss-btn"
                          onClick={() => onDismissAlert && onDismissAlert(alert.studentSocketId, alert.id)}
                          title="Dismiss alert"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {expandedDetails[alert.id || index] && (
                      <tr className="details-row">
                        <td colSpan="7">
                          <div className="alert-details">
                            <div className="details-section">
                              <h4>Alert Details</h4>
                              <div className="details-grid">
                                <div className="detail-item">
                                  <span className="detail-label">Alert ID:</span>
                                  <span className="detail-value">{alert.id || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Source:</span>
                                  <span className="detail-value">{alert.source || 'Student'}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Confidence:</span>
                                  <span className="detail-value">{alert.confidence || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Full Message:</span>
                                  <span className="detail-value full-message">{alert.message}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="details-section">
                              <h4>Student Context</h4>
                              <div className="details-grid">
                                <div className="detail-item">
                                  <span className="detail-label">Student ID:</span>
                                  <span className="detail-value">{alert.studentId}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Violation History:</span>
                                  <span className="detail-value">
                                    {attempts.history?.length || 0} violations recorded
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Attempts Left:</span>
                                  <span className="detail-value attempts-left">
                                    {attempts.attemptsLeft}/{attempts.maxAttempts}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="details-section">
                              <h4>System Info</h4>
                              <div className="details-grid">
                                <div className="detail-item">
                                  <span className="detail-label">Timestamp:</span>
                                  <span className="detail-value">{alert.timestamp}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Alert Type:</span>
                                  <span className="detail-value">{alert.type || 'warning'}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Detection Method:</span>
                                  <span className="detail-value">{alert.detectionType || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination/Summary */}
      <div className="log-footer">
        <div className="log-summary">
          Showing {filteredAlerts.length} alerts
          {selectedStudent !== 'all' && ` for selected student`}
          {selectedType !== 'all' && ` of type "${selectedType}"`}
        </div>
        
        <div className="timeline-preview">
          <h4>Alert Timeline (Last 24 Hours)</h4>
          <div className="timeline-bars">
            {stats.timeline.map((hour, index) => (
              <div key={index} className="timeline-hour">
                <div 
                  className="timeline-bar"
                  style={{ 
                    height: `${Math.min(hour.count * 10, 100)}px`,
                    backgroundColor: hour.count > 5 ? '#ff6b6b' : 
                                   hour.count > 2 ? '#ffd166' : '#06d6a0'
                  }}
                  title={`${hour.count} alerts at ${hour.hour}:00`}
                ></div>
                <span className="timeline-label">{hour.hour}:00</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}