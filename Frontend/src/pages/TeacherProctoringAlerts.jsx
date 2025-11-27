// TeacherProctoringAlerts.jsx
import React, { useState, useEffect } from 'react';
import './TeacherProctoringAlerts.css';

export default function TeacherProctoringAlerts({ proctoringAlerts, students, onClearAlerts }) {
  const [expandedStudents, setExpandedStudents] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', 'high', 'medium', 'low'

  // Toggle student alerts view
  const toggleStudentAlerts = (studentSocketId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentSocketId]: !prev[studentSocketId]
    }));
  };

  // Filter alerts by severity
  const getFilteredAlerts = (studentAlerts) => {
    if (filter === 'all') return studentAlerts;
    return studentAlerts.filter(alert => alert.severity === filter);
  };

  // Get alert icon based on type
  const getAlertIcon = (type, severity) => {
    if (severity === 'high') return '🚨';
    if (severity === 'medium') return '⚠️';
    if (type === 'danger') return '🔴';
    if (type === 'warning') return '🟡';
    return 'ℹ️';
  };

  // Get alert color based on severity
  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#44aaff';
      default: return '#666666';
    }
  };

  // Get students with alerts
  const studentsWithAlerts = students.filter(student => {
    const studentAlerts = proctoringAlerts[student.socketId] || [];
    return studentAlerts.length > 0;
  });

  if (studentsWithAlerts.length === 0) {
    return (
      <div className="teacher-proctoring-alerts">
        <div className="alerts-header">
          <h3>📊 Proctoring Alerts</h3>
          <span className="no-alerts-badge">0</span>
        </div>
        <div className="no-alerts-message">
          <div className="no-alerts-icon">✅</div>
          <p>No active alerts</p>
          <small>All students are following exam rules</small>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-proctoring-alerts">
      <div className="alerts-header">
        <h3>📊 Proctoring Alerts</h3>
        <span className="alerts-count-badge">{studentsWithAlerts.length}</span>
        
        <div className="alerts-filter">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Alerts</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>
      </div>

      <div className="alerts-list">
        {studentsWithAlerts.map((student) => {
          const studentAlerts = proctoringAlerts[student.socketId] || [];
          const filteredAlerts = getFilteredAlerts(studentAlerts);
          const isExpanded = expandedStudents[student.socketId];

          if (filteredAlerts.length === 0) return null;

          return (
            <div key={student.socketId} className="student-alerts-card">
              <div 
                className="student-alerts-header"
                onClick={() => toggleStudentAlerts(student.socketId)}
              >
                <div className="student-info">
                  <div 
                    className="student-avatar"
                    style={{ backgroundColor: '#4ECDC4' }}
                  >
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="student-details">
                    <span className="student-name">{student.name}</span>
                    <span className="student-id">ID: {student.studentId}</span>
                  </div>
                </div>
                
                <div className="alerts-summary">
                  <span className="alert-count">{studentAlerts.length} alert(s)</span>
                  <span className="latest-alert-time">
                    Latest: {studentAlerts[0]?.timestamp}
                  </span>
                  <span className={`severity-indicator severity-${studentAlerts[0]?.severity || 'medium'}`}>
                    {studentAlerts[0]?.severity || 'medium'}
                  </span>
                </div>

                <div className="alerts-controls">
                  <button 
                    className="clear-all-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearAlerts(student.socketId);
                    }}
                    title="Clear all alerts for this student"
                  >
                    🗑️
                  </button>
                  <span className="expand-icon">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="alerts-details">
                  <div className="alerts-timeline">
                    {filteredAlerts.map((alert, index) => (
                      <div key={alert.id || index} className="alert-timeline-item">
                        <div 
                          className="alert-icon"
                          style={{ color: getAlertColor(alert.severity) }}
                        >
                          {getAlertIcon(alert.type, alert.severity)}
                        </div>
                        
                        <div className="alert-content">
                          <div className="alert-message">{alert.message}</div>
                          <div className="alert-meta">
                            <span className="alert-time">{alert.timestamp}</span>
                            <span className={`alert-severity severity-${alert.severity}`}>
                              {alert.severity}
                            </span>
                            {alert.confidence && (
                              <span className="alert-confidence">
                                Confidence: {(alert.confidence * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          
                          {alert.details && (
                            <div className="alert-details">
                              <pre>{JSON.stringify(alert.details, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="alerts-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Alerts:</span>
                      <span className="stat-value">{studentAlerts.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">First Alert:</span>
                      <span className="stat-value">
                        {studentAlerts[studentAlerts.length - 1]?.timestamp}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Status:</span>
                      <span className={`stat-value status-${student.connectionStatus}`}>
                        {student.connectionStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="alerts-footer">
        <div className="footer-stats">
          <span>Total Students with Alerts: {studentsWithAlerts.length}</span>
          <span>•</span>
          <span>Active Monitoring: {students.length}</span>
        </div>
        <button 
          className="clear-all-alerts-btn"
          onClick={() => {
            studentsWithAlerts.forEach(student => {
              onClearAlerts(student.socketId);
            });
          }}
        >
          🗑️ Clear All Alerts
        </button>
      </div>
    </div>
  );
}