import React, { useState, useEffect } from 'react';
import './ViolationSummaryModal.css';

const ViolationSummaryModal = ({ isOpen, onClose, examId, examTitle, examType }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [detailedViolations, setDetailedViolations] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && examId) {
      fetchViolationSummary();
    }
  }, [isOpen, examId]);

  const fetchViolationSummary = async () => {
    try {
      setLoading(true);
      const { getViolationSummary } = await import('../lib/api');
      
      const response = await getViolationSummary(examId);
      
      if (response.success) {
        setStudents(response.data.students || []);
        setSummary(response.data.summary);
      } else {
        console.error('Failed to fetch summary:', response.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching violation summary:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Add this function for fetching detailed violation breakdowns
  const fetchStudentViolationDetails = async (studentId) => {
    try {
      setLoadingDetails(true);
      const { default: api } = await import('../lib/api');
      const response = await api.get(`/exams/${examId}/violation-details/${studentId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to fetch student details:', error);
    } finally {
      setLoadingDetails(false);
    }
    return null;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  const getViolationType = (type) => {
    const types = {
      'tab_switching': 'Tab Switching',
      'audio_detection': 'Audio Detected',
      'speaking_detected': 'Speaking Detected',
      'multiple_people': 'Multiple People',
      'no_face_detected': 'No Face Detected',
      'phone_usage': 'Phone Usage',
      'gaze_deviation': 'Looking Away',
      'suspicious_gesture': 'Suspicious Gesture',
      'screenshot_attempt': 'Screenshot Attempt',
      'low_attention_score': 'Low Attention',
      'unknown': 'Unknown Violation'
    };
    return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
      'critical': 'bg-purple-100 text-purple-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢',
      'critical': '🟣'
    };
    return icons[severity] || '⚪';
  };

  // Function to render detailed violation breakdown
  const renderViolationBreakdown = () => {
    if (!detailedViolations || !detailedViolations.violationsByType) {
      return null;
    }

    const { violationsByType, totalCount, severityBreakdown } = detailedViolations;

    return (
      <div className="detailed-breakdown">
        <div className="breakdown-header">
          <h4>📊 Detailed Violation Analysis</h4>
          <div className="total-count-badge">
            Total: {totalCount} violations
          </div>
        </div>
        
        {/* Severity Overview */}
        <div className="severity-overview">
          <h5>Severity Distribution</h5>
          <div className="severity-chips">
            {Object.entries(severityBreakdown || {}).map(([severity, count]) => (
              <div key={severity} className={`severity-chip ${severity}`}>
                <span className="severity-icon-small">{getSeverityIcon(severity)}</span>
                <span className="severity-label">{severity.toUpperCase()}</span>
                <span className="severity-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Violation Type Breakdown */}
        <div className="type-breakdown">
          <h5>Violations by Type</h5>
          <div className="breakdown-grid">
            {Object.entries(violationsByType).map(([type, data]) => (
              <div key={type} className="type-card">
                <div className="type-header">
                  <span className="type-name">{getViolationType(type)}</span>
                  <span className="type-count">{data.count}</span>
                </div>
                <div className="type-details">
                  <div className="type-severity">
                    <span className={`severity-badge ${getSeverityColor(data.severity)}`}>
                      {data.severity}
                    </span>
                  </div>
                  {data.firstOccurrence && (
                    <div className="type-timeline">
                      <small>First: {formatTime(data.firstOccurrence)}</small>
                      {data.lastOccurrence && (
                        <small>Last: {formatTime(data.lastOccurrence)}</small>
                      )}
                    </div>
                  )}
                </div>
                {data.recentMessages && data.recentMessages.length > 0 && (
                  <div className="type-examples">
                    <small>Recent Examples:</small>
                    <ul className="example-list">
                      {data.recentMessages.slice(0, 2).map((msg, idx) => (
                        <li key={idx} className="example-item">
                          {msg}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time Pattern Analysis */}
        {detailedViolations.timePattern && (
          <div className="time-pattern">
            <h5>⏰ Time Pattern Analysis</h5>
            <div className="pattern-info">
              <div className="pattern-item">
                <span className="pattern-label">Peak Time:</span>
                <span className="pattern-value">
                  {formatTime(detailedViolations.timePattern.peakTime)}
                </span>
              </div>
              <div className="pattern-item">
                <span className="pattern-label">Frequency:</span>
                <span className="pattern-value">
                  {detailedViolations.timePattern.frequency} per hour
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const exportToCSV = () => {
    if (students.length === 0) return;
    
    const headers = ['Student Name', 'Email', 'Status', 'Score', 'Violations', 'Last Violation'];
    const rows = students.map(student => [
      student.name,
      student.email,
      student.status,
      `${student.score}/${student.maxScore} (${student.percentage}%)`,
      student.violations.length,
      student.violations.length > 0 ? formatTime(student.violations[0].timestamp) : 'None'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violation-summary-${examTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle student selection with detailed data fetch
  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setDetailedViolations(null);
    
    const details = await fetchStudentViolationDetails(student._id);
    if (details) {
      setDetailedViolations(details);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay violation-summary-modal">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>📊 Proctoring Violation Summary</h2>
            <p className="exam-subtitle">
              {examTitle} • {examType === 'live-class' ? '🎥 Live Class' : '📝 Async Quiz'}
            </p>
          </div>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading violation data...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📊</div>
              <h3>No Violation Data Available</h3>
              <p>No proctoring data has been recorded for this exam yet.</p>
            </div>
          ) : (
            <div className="violation-content">
              {/* Summary Stats */}
              {summary && (
                <div className="summary-stats">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <div className="stat-value">{summary.totalStudents}</div>
                      <div className="stat-label">Total Students</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <div className="stat-value">{summary.completed}</div>
                      <div className="stat-label">Completed</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                      <div className="stat-value">{summary.averageScore.toFixed(1)}%</div>
                      <div className="stat-label">Avg Score</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-info">
                      <div className="stat-value">{summary.totalViolations}</div>
                      <div className="stat-label">Violations</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="violation-layout">
                {/* Student List */}
                <div className="student-list-section">
                  <h3>Students ({students.length})</h3>
                  <div className="student-list">
                    {students.map(student => (
                      <div
                        key={student._id}
                        className={`student-item ${selectedStudent?._id === student._id ? 'selected' : ''}`}
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div className="student-info">
                          <div className="student-avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="student-details">
                            <div className="student-name">{student.name}</div>
                            <div className="student-email">{student.email}</div>
                            <div className="student-status">
                              <span className={`status-badge ${student.status}`}>
                                {student.status === 'completed' ? '✅ Completed' : '⏳ Not Started'}
                              </span>
                              {student.violations.length > 0 && (
                                <span className="violation-count-badge">
                                  🚨 {student.violations.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {student.hasCompleted && (
                          <div className="student-score">
                            {student.percentage}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Violation Details */}
                <div className="violation-details-section">
                  {selectedStudent ? (
                    <div className="selected-student-details">
                      <div className="student-header">
                        <h3>{selectedStudent.name}</h3>
                        <div className="student-meta">
                          <span className="student-email">{selectedStudent.email}</span>
                          <span className={`status-badge ${selectedStudent.status}`}>
                            {selectedStudent.status === 'completed' ? '✅ Completed' : '⏳ Not Started'}
                          </span>
                        </div>
                        {selectedStudent.hasCompleted && (
                          <div className="student-score-card">
                            <div className="score-display">
                              <span className="score-value">{selectedStudent.score}/{selectedStudent.maxScore}</span>
                              <span className="score-percentage">({selectedStudent.percentage}%)</span>
                            </div>
                            <div className="attempts-info">
                              Attempts: {selectedStudent.attemptsUsed}/{selectedStudent.attemptsUsed + selectedStudent.attemptsLeft}
                            </div>
                          </div>
                        )}
                      </div>

                      {loadingDetails ? (
                        <div className="loading-details">
                          <div className="loading-spinner small"></div>
                          <p>Loading detailed analysis...</p>
                        </div>
                      ) : (
                        <>
                          {/* Detailed Violation Breakdown */}
                          {renderViolationBreakdown()}

                          <div className="violations-list">
                            <h4>Violation History ({selectedStudent.violations.length})</h4>
                            {selectedStudent.violations.length === 0 ? (
                              <div className="no-violations">
                                <div className="no-violations-icon">✅</div>
                                <p>No violations detected for this student</p>
                                <small>Good proctoring compliance</small>
                              </div>
                            ) : (
                              <div className="violation-items">
                                {selectedStudent.violations.map((violation, index) => (
                                  <div key={index} className="violation-item">
                                    <div className="violation-header">
                                      <div className="violation-type">
                                        <span className={`severity-icon ${violation.severity}`}>
                                          {getSeverityIcon(violation.severity)}
                                        </span>
                                        <span className="violation-title">
                                          {getViolationType(violation.type)}
                                        </span>
                                        <span className={`severity-badge ${getSeverityColor(violation.severity)}`}>
                                          {violation.severity}
                                        </span>
                                      </div>
                                      <div className="violation-time">
                                        {formatDate(violation.timestamp)} {formatTime(violation.timestamp)}
                                      </div>
                                    </div>
                                    <div className="violation-message">
                                      {violation.message}
                                    </div>
                                    {violation.detectionSource && (
                                      <div className="violation-source">
                                        <small>Detected via: {violation.detectionSource}</small>
                                        {violation.confidence && (
                                          <small>Confidence: {(violation.confidence * 100).toFixed(1)}%</small>
                                        )}
                                      </div>
                                    )}
                                    {violation.screenshot && (
                                      <div className="violation-evidence">
                                        <p className="evidence-label">Evidence:</p>
                                        <img 
                                          src={violation.screenshot} 
                                          alt="Violation evidence" 
                                          className="evidence-image"
                                          onClick={() => window.open(violation.screenshot, '_blank')}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="select-student-prompt">
                      <div className="prompt-icon">👈</div>
                      <h3>Select a Student</h3>
                      <p>Click on a student from the list to view their detailed violation history</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {!loading && students.length > 0 && (
            <button className="btn-primary" onClick={exportToCSV}>
              📥 Export to CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationSummaryModal;