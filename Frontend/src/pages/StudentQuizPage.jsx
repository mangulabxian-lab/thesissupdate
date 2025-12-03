<<<<<<< HEAD
// StudentQuizPage.jsx - COMPLETE FIXED VERSION
=======
// StudentQuizPage.jsx - COMPLETE FIXED VERSION WITH ENHANCED DISCONNECTION HANDLER
>>>>>>> backupRepo/main
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getQuizForStudent, submitQuizAnswers } from '../lib/api';
import './StudentQuizPage.css';
<<<<<<< HEAD
import api from '../lib/api'; // Ito yung kulang!
=======

>>>>>>> backupRepo/main
// ==================== WAITING ROOM COMPONENT ====================
const WaitingRoomComponent = React.memo(({ 
  requiresCamera, 
  requiresMicrophone, 
  onExamStarted,
  onCancel,
  examTitle,
  className,
<<<<<<< HEAD
  teacherDetectionSettings,
  examType = 'asynchronous',// ✅ ADD THIS PROP
   waitingRoomRequired = true // ✅ NEW PROP
}) => {

  
=======
  teacherDetectionSettings
}) => {
>>>>>>> backupRepo/main
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: { granted: false, error: '' },
    microphone: { granted: false, error: '' }
  });
  const [retryCount, setRetryCount] = useState(0);
  const [canEnterExam, setCanEnterExam] = useState(false);

  const checkPermissions = useCallback(async () => {
    setCheckingPermissions(true);
    
    const newStatus = {
      camera: { granted: false, error: '' },
      microphone: { granted: false, error: '' }
    };

    try {
      // Check camera permission
      if (requiresCamera) {
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
          });
          newStatus.camera.granted = true;
          cameraStream.getTracks().forEach(track => track.stop());
        } catch (error) {
          newStatus.camera.error = getErrorMessage(error);
        }
      } else {
        newStatus.camera.granted = true;
      }

      // ✅ MICROPHONE IS NOW MANDATORY
      if (requiresMicrophone) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          newStatus.microphone.granted = true;
          micStream.getTracks().forEach(track => track.stop());
        } catch (error) {
          newStatus.microphone.error = getErrorMessage(error);
        }
      } else {
        newStatus.microphone.granted = true;
      }

      setPermissionStatus(newStatus);
      
      // ✅ STRICTER REQUIREMENT: MICROPHONE IS MANDATORY IF REQUIRED
      const allRequiredGranted = 
        (!requiresCamera || newStatus.camera.granted) && 
        (!requiresMicrophone || newStatus.microphone.granted);
      
      setCanEnterExam(allRequiredGranted);
      
    } catch (error) {
      console.error('Permission check error:', error);
    } finally {
      setCheckingPermissions(false);
<<<<<<< HEAD

    }
    
  }, [requiresCamera, requiresMicrophone]);

  useEffect(() => {
    const checkIfCanProceed = () => {
      // For async exams: Can proceed immediately if permissions granted
      if (examType === 'asynchronous' && canEnterExam) {
        console.log('✅ Async exam - Student can proceed');
        // Auto-proceed after 3 seconds
        const timer = setTimeout(() => {
          if (canEnterExam) {
            onExamStarted();
          }
        }, 3000);
        
        return () => clearTimeout(timer);
      }
      
      // For live classes: Wait for teacher signal
      if (examType === 'live-class' && canEnterExam) {
        console.log('🎥 Live class - Waiting for teacher signal');
        // Do NOT auto-proceed - wait for socket event
      }
    };
    
    if (canEnterExam) {
      checkIfCanProceed();
    }
  }, [canEnterExam, examType, onExamStarted]);

=======
    }
  }, [requiresCamera, requiresMicrophone]);

>>>>>>> backupRepo/main
  const getErrorMessage = (error) => {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Permission denied. Please allow access in your browser settings.';
      case 'NotFoundError':
        return 'Device not found. Please check if your camera/microphone is connected.';
      case 'NotReadableError':
        return 'Device is busy. Please close other applications using your camera/microphone.';
      case 'OverconstrainedError':
        return 'Device does not meet requirements.';
      default:
        return 'Unable to access device. Please check your permissions.';
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    checkPermissions();
  };

  const handleEnterExam = () => {
    if (canEnterExam) {
      onExamStarted();
    } else {
      // ✅ PREVENT ENTRY IF MICROPHONE NOT GRANTED
      if (requiresMicrophone && !permissionStatus.microphone.granted) {
        alert('🎤 Microphone access is REQUIRED to enter the exam. Please grant microphone permission.');
        handleRetry();
      }
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return (
    <div className="waiting-room-overlay">
      <div className="waiting-room-modal">
        <div className="waiting-room-header">
<<<<<<< HEAD
          <h2>🕒 Exam Entry Requirements</h2>
=======
          <h2>EXAM REMINDER</h2>
>>>>>>> backupRepo/main
          <div className="exam-info-waiting">
            <h3>{examTitle}</h3>
            <p>Class: {className}</p>
          </div>
        </div>

        <div className="waiting-content">
<<<<<<< HEAD
        
<div className="waiting-content">
  {/* ✅ ASYNC EXAM STRICT WARNING */}
  {examType === 'asynchronous' && (
    <div className="async-exam-warning strict">
      <div className="warning-icon">🔒</div>
      <div className="warning-content">
        <h4>🔒 Strict Proctoring Mode</h4>
        <p><strong>This is an asynchronous exam with STRICT proctoring requirements:</strong></p>
        <ul className="strict-rules">
          {requiresCamera && <li>📹 <strong>Camera MUST be ON throughout the exam</strong></li>}
          {requiresMicrophone && <li>🎤 <strong>Microphone MUST be ON for audio monitoring</strong></li>}
          <li>👁️ <strong>Face detection will be monitored continuously</strong></li>
          <li>🎯 <strong>You cannot pause or disable monitoring</strong></li>
          <li>⏰ <strong>Timer starts immediately upon entry</strong></li>
        </ul>
        <p className="critical-text">You will be automatically disqualified if monitoring is interrupted.</p>
      </div>
    </div>
  )}
</div>
=======
>>>>>>> backupRepo/main
          {/* ✅ MICROPHONE REQUIREMENT WARNING */}
          {requiresMicrophone && (
            <div className="requirement-warning critical">
              <div className="warning-icon">🎤</div>
              <div className="warning-content">
                <h4>🎤 Microphone Required</h4>
                <p><strong>This exam requires microphone access for audio proctoring and alert detection.</strong></p>
                <p className="critical-text">You MUST enable microphone access to enter the exam.</p>
              </div>
            </div>
          )}

          <div className="permission-status">
<<<<<<< HEAD
            <h4>📋 System Requirements Check</h4>
=======
            <h4>Before entering the exam, please review and follow all requirements and proctoring rules below.</h4>
>>>>>>> backupRepo/main
            
            {requiresCamera && (
              <div className={`requirement-item ${permissionStatus.camera.granted ? 'granted' : 'denied'}`}>
                <div className="requirement-icon">
                  {permissionStatus.camera.granted ? '✅' : '❌'}
                </div>
                <div className="requirement-content">
                  <h4>Camera Access</h4>
                  <p>Required for proctoring and monitoring</p>
                  {!permissionStatus.camera.granted && permissionStatus.camera.error && (
                    <div className="error-message">{permissionStatus.camera.error}</div>
                  )}
                </div>
              </div>
            )}

            {requiresMicrophone && (
              <div className={`requirement-item ${permissionStatus.microphone.granted ? 'granted' : 'denied'} ${
                !permissionStatus.microphone.granted ? 'critical-requirement' : ''
              }`}>
                <div className="requirement-icon">
                  {permissionStatus.microphone.granted ? '✅' : '❌'}
                </div>
                <div className="requirement-content">
                  <h4>Microphone Access <span className="required-badge">MANDATORY</span></h4>
                  <p><strong>Required for audio monitoring and alert detection</strong></p>
                  {!permissionStatus.microphone.granted && permissionStatus.microphone.error && (
                    <div className="error-message critical">{permissionStatus.microphone.error}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ✅ ENTRY STATUS */}
          <div className="entry-status">
            {canEnterExam ? (
              <div className="status-granted">
                <div className="status-icon">✅</div>
                <div className="status-content">
                  <h4>All Requirements Met</h4>
                  <p>You can now enter the exam session.</p>
                </div>
              </div>
            ) : (
              <div className="status-denied">
                <div className="status-icon">❌</div>
                <div className="status-content">
                  <h4>Requirements Not Met</h4>
                  <p>You must grant all required permissions to enter the exam.</p>
                  {requiresMicrophone && !permissionStatus.microphone.granted && (
                    <p className="critical-warning">🎤 <strong>Microphone access is MANDATORY for this exam.</strong></p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="detection-info">
            <h4>🚨 Proctoring Information</h4>
            <div className="detection-rules">
              <div className="rule-item">
                <span className="rule-icon">👁️</span>
                <span className="rule-text">Face must be visible to camera at all times</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">🎤</span>
                <span className="rule-text">Microphone will monitor for suspicious sounds and speaking</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">📵</span>
                <span className="rule-text">No mobile phones or secondary devices allowed</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">👥</span>
                <span className="rule-text">No other people in the room</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">👀</span>
                <span className="rule-text">Eye gaze monitoring is active</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">🤚</span>
                <span className="rule-text">Hand gesture detection is active</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">💻</span>
                <span className="rule-text">Tab switching is monitored - stay on this page</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">📸</span>
                <span className="rule-text">Screenshot detection is active</span>
              </div>
            </div>
          </div>

          <div className="attempts-info">
            <h4>⚠️ Violation System</h4>
            <p>You have <strong>{teacherDetectionSettings.maxAttempts || 10} attempts</strong> for violations.</p>
            <p>Violations include: Speaking detected, suspicious sounds, looking away, phone usage, etc.</p>
          </div>

          {!canEnterExam && (
            <div className="waiting-indicator">
              <div className="loading-spinner-large"></div>
              <p>Waiting for required permissions...</p>
              {requiresMicrophone && !permissionStatus.microphone.granted && (
                <small className="critical-warning">🎤 <strong>Microphone access is required to continue</strong></small>
              )}
            </div>
          )}
        </div>

        <div className="waiting-actions">
          {checkingPermissions ? (
            <div className="checking-permissions">
              <div className="loading-spinner"></div>
              <span>Checking permissions...</span>
            </div>
          ) : (
            <>
              {!canEnterExam && (
                <div className="action-buttons">
                  <button className="retry-btn" onClick={handleRetry}>
                    🔄 Retry Permission Check
                  </button>
                </div>
              )}
              
              {canEnterExam && (
                <button className="enter-exam-btn" onClick={handleEnterExam}>
                  🚪 Enter Exam Session
                </button>
              )}
              
              <button className="cancel-btn" onClick={onCancel}>
                ← Leave Waiting Room
              </button>
            </>
          )}
        </div>

        {retryCount > 0 && (
          <div className="retry-hint">
            <p>💡 <strong>Still having issues?</strong></p>
            <ul>
              <li>Check if your microphone is being used by another application</li>
              <li>Make sure you've clicked "Allow" when prompted for microphone access</li>
              <li>Try using a different browser (Chrome recommended)</li>
              <li>Ensure your browser is up to date</li>
              {requiresMicrophone && (
                <li><strong>Microphone is required - you cannot enter without it</strong></li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

// ==================== MICROPHONE COMPONENT ====================
const MicrophoneComponent = React.memo(({ 
  requiresMicrophone,
  onMicrophoneStateChange,
  onProctoringAlert,
  examId
}) => {
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const [micState, setMicState] = useState({
    isConnected: false,
    isInitializing: false,
    error: '',
    hasMicrophone: false,
    isMuted: true,
    isSpeaking: false
  });

  const [audioLevel, setAudioLevel] = useState(0);
  const audioLevelRef = useRef(0);

  const captureAudio = useCallback(async () => {
    if (!requiresMicrophone || !micState.isConnected || micState.isMuted) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      streamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      
      let lastAudioSend = 0;
      let audioBuffer = [];
      
      processor.onaudioprocess = (e) => {
        if (!micState.isConnected || micState.isMuted) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate audio level for visualization
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const level = Math.min(100, Math.max(0, rms * 1000));
        audioLevelRef.current = level;
        setAudioLevel(level);

        // Detect speaking state
        const isCurrentlySpeaking = level > 15;
        if (isCurrentlySpeaking !== micState.isSpeaking) {
          setMicState(prev => ({ ...prev, isSpeaking: isCurrentlySpeaking }));
          
          if (isCurrentlySpeaking && !micState.isMuted) {
            console.log('🎤 Speaking detected, level:', level);
            
            if (Date.now() - lastAudioSend > 5000) {
              const buffer = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                buffer[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              fetch('http://localhost:5000/process_audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audio: buffer,
                  exam_id: examId,
                  student_id: 'student-user',
                  timestamp: new Date().toISOString()
                })
              }).then(response => response.json())
                .then(data => {
                  console.log('🎤 Audio processing result:', data);
                  if (data.audioStatus === 'speaking' && data.confidence > 0.6) {
                    onProctoringAlert({
                      message: `🎤 Speaking detected (confidence: ${Math.round(data.confidence * 100)}%)`,
                      type: 'warning',
                      severity: 'medium',
                      timestamp: new Date().toLocaleTimeString(),
                      detectionType: 'audio_detection'
                    });
                  }
                })
                .catch(error => {
                  console.error('Audio send error:', error);
                });
              
              lastAudioSend = Date.now();
            }
          }
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (error) {
      console.error('Audio capture error:', error);
      setMicState(prev => ({
        ...prev,
        error: 'Microphone access failed',
        isConnected: false
      }));
      onMicrophoneStateChange?.(false);
    }
  }, [requiresMicrophone, examId, onMicrophoneStateChange, onProctoringAlert, micState.isConnected, micState.isMuted, micState.isSpeaking]);

  const initializeMicrophone = useCallback(async () => {
    if (!requiresMicrophone) return;

    try {
      setMicState(prev => ({ ...prev, isInitializing: true, error: '' }));

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone not supported');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === 'audioinput');
      
      if (microphones.length === 0) {
        throw new Error('No microphone found');
      }

      setMicState(prev => ({ 
        ...prev, 
        hasMicrophone: true,
        isInitializing: false 
      }));

      onMicrophoneStateChange?.(false);

    } catch (error) {
      console.error('Microphone initialization failed:', error);
      
      let userMessage = 'Microphone setup failed';
      if (error.name === 'NotAllowedError') userMessage = 'Microphone permission denied';
      else if (error.name === 'NotFoundError') userMessage = 'No microphone found';
      else if (error.name === 'NotReadableError') userMessage = 'Microphone is busy';
      
      setMicState(prev => ({
        ...prev,
        isConnected: false,
        isInitializing: false,
        error: userMessage
      }));
      onMicrophoneStateChange?.(false);
    }
  }, [requiresMicrophone, onMicrophoneStateChange]);

  const toggleMicrophone = async () => {
    if (micState.isInitializing) return;

    const newMuteState = !micState.isMuted;
    
    if (newMuteState) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setMicState(prev => ({
        ...prev,
        isMuted: true,
        isSpeaking: false
      }));
      setAudioLevel(0);
      audioLevelRef.current = 0;
      onMicrophoneStateChange?.(false);
      
    } else {
      setMicState(prev => ({ ...prev, isMuted: false, isConnected: true }));
      onMicrophoneStateChange?.(true);
      await captureAudio();
    }
  };

  const retryMicrophone = async () => {
    await initializeMicrophone();
  };

  useEffect(() => {
    let animationFrame;
    
    const updateAudioLevel = () => {
      setAudioLevel(audioLevelRef.current);
      animationFrame = requestAnimationFrame(updateAudioLevel);
    };
    
    if (micState.isConnected && !micState.isMuted) {
      animationFrame = requestAnimationFrame(updateAudioLevel);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [micState.isConnected, micState.isMuted]);

  useEffect(() => {
    if (!requiresMicrophone) return;

    let mounted = true;

    const initMicrophone = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphones = devices.filter(device => device.kind === 'audioinput');
        
        if (mounted) {
          setMicState(prev => ({ ...prev, hasMicrophone: microphones.length > 0 }));
        }

        if (microphones.length > 0 && mounted) {
          await initializeMicrophone();
        } else if (mounted) {
          setMicState(prev => ({ 
            ...prev, 
            error: 'No microphone found', 
            isInitializing: false 
          }));
        }
      } catch (error) {
        if (mounted) {
          setMicState(prev => ({ 
            ...prev, 
            error: 'Microphone setup failed', 
            isInitializing: false 
          }));
        }
      }
    };

    initMicrophone();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [requiresMicrophone, initializeMicrophone]);

  if (!requiresMicrophone) return null;

  return (
    <div className="microphone-section">
      <div className="microphone-header">
        <div className="user-info">
          <span className="user-name">Microphone</span>
          <span className={`detection-status ${micState.isConnected && !micState.isMuted ? 'normal' : 'bad'}`}>
            {micState.isConnected && !micState.isMuted ? '🎤 Active' : '🎤 Muted'}
          </span>
          {micState.isConnected && !micState.isMuted && micState.isSpeaking && (
            <span className="speaking-status">🔊 Speaking</span>
          )}
        </div>
        <div className="microphone-controls">
          <button 
            className={`mic-icon ${micState.isMuted ? 'muted' : 'active'} ${
              micState.isSpeaking && !micState.isMuted ? 'speaking' : ''
            }`}
            onClick={toggleMicrophone}
            disabled={micState.isInitializing || !micState.hasMicrophone}
          >
            <div className="mic-icon-container">
              {micState.isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3.7v6.8l-2.5 2.5V6.7H7v8.8c0 .28.22.5.5.5h2.29l-2.79 2.79-.14.14a.5.5 0 00.36.85h7.56l2.5-2.5H12V3.7z"/>
                  <path d="M16 9.2v2.77l2 2V9.2h-2zM19.29 5.79L18 7.08l2 2 1.29-1.29a1 1 0 000-1.41l-1.59-1.59a1 1 0 00-1.41 0L18 4.08l-2-2-1.29 1.29 2 2-2 2 1.29 1.29 2-2 2 2 1.29-1.29-2-2 2-2z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
              
              {!micState.isMuted && (
                <div className="audio-levels">
                  {[1, 2, 3].map((bar) => (
                    <div 
                      key={bar}
                      className={`audio-bar bar-${bar} ${
                        audioLevel > bar * 25 ? 'active' : ''
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="microphone-status">
        {micState.isInitializing && (
          <div className="initializing-message">
            <div className="loading-spinner-small"></div>
            <span>Initializing microphone...</span>
          </div>
        )}
        
        {micState.error && (
          <div className="microphone-error">
            <button className="retry-btn" onClick={retryMicrophone}>🔄 Retry</button>
            <span className="error-message">{micState.error}</span>
          </div>
        )}
        
        {!micState.error && !micState.isInitializing && (
          <div className="microphone-info">
            <span className="status-text">
              {micState.isMuted ? 'Microphone is muted' : 'Microphone is active'}
            </span>
            {micState.isSpeaking && !micState.isMuted && (
              <span className="speaking-indicator">🔊 Audio detected</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// ==================== CAMERA COMPONENT ====================
<<<<<<< HEAD


=======
>>>>>>> backupRepo/main
const CameraComponent = React.memo(({ 
  requiresCamera, 
  onCameraStateChange,
  onProctoringAlert,
  examId,
  teacherDetectionSettings,
  socketRef,
  tabSwitchCount = 0,
  windowBlurCount = 0,
  microphoneActive = false,
<<<<<<< HEAD
  isSpeaking = false,
  examType = 'asynchronous'
=======
  isSpeaking = false
>>>>>>> backupRepo/main
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState({
    isConnected: false,
    isInitializing: false,
    error: '',
    hasCamera: false
  });
  const [camOn, setCamOn] = useState(true);
  
  const captureIntervalRef = useRef(null);

  const getDetectionTypeFromActivity = (activity) => {
    if (activity.includes('TAB')) return 'tab_switching';
    if (activity.includes('AUDIO')) return 'audio_detection';
    if (activity.includes('GESTURE')) return 'suspicious_gesture';
    if (activity.includes('MULTIPLE')) return 'multiple_people';
    if (activity.includes('GAZE')) return 'gaze_deviation';
    if (activity.includes('HEAD')) return 'head_pose';
    if (activity.includes('MOUTH')) return 'mouth_movement';
<<<<<<< HEAD
    if (activity.includes('NO FACE')) return 'no_face_detected'; // ✅ ADD THIS LINE
    if (activity.includes('LOW ATTENTION')) return 'low_attention_score'; // ✅ ADD THIS LINE
=======
    if (activity.includes('NO FACE')) return 'no_face_detected';
    if (activity.includes('LOW ATTENTION')) return 'low_attention_score';
>>>>>>> backupRepo/main
    
    return 'unknown';
  };

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !requiresCamera || !cameraState.isConnected || !camOn) return;
    
    try {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const studentSocketId = socketRef.current?.id || 'unknown-socket';
        
      const detectionData = {
        image: imageData,
        exam_id: examId,
        student_id: 'student-user',
        student_socket_id: studentSocketId,
        timestamp: new Date().toISOString(),
        detection_settings: teacherDetectionSettings,
        behavior_data: {
          tab_switch_count: tabSwitchCount,
          window_blur_count: windowBlurCount,
          last_activity: new Date().toISOString(),
          microphone_active: microphoneActive,
          is_speaking: isSpeaking
        }
      };
      
      console.log('📊 Sending detection with behavior data:', {
        tabSwitches: tabSwitchCount,
        windowBlurs: windowBlurCount,
        micActive: microphoneActive,
        speaking: isSpeaking
      });
      
      const response = await fetch('http://localhost:5000/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detectionData)
      });
      
<<<<<<< HEAD
      
    if (response.ok) {
      const results = await response.json();
      
      if (results.suspiciousActivities && results.suspiciousActivities.length > 0) {
        // ✅ BAGONG LOGIC: FOR ASYNC EXAMS - ALL DETECTIONS ARE ACTIVE
        const filteredAlerts = results.suspiciousActivities.filter(activity => {
          // Check exam type - if async, enable ALL detections
          const examTypeFromProps = 'asynchronous'; // Replace with actual prop
          
          if (examTypeFromProps === 'asynchronous') {
            // ✅ ASYNC EXAMS: LAHAT NG DETECTIONS ENABLED
            return true;
          } else {
            // ✅ LIVE CLASS: Follow teacher settings
=======
      if (response.ok) {
        const results = await response.json();
        console.log('📊 Proctoring results:', results);
        
        if (results.suspiciousActivities && results.suspiciousActivities.length > 0) {
            const filteredAlerts = results.suspiciousActivities.filter(activity => {
>>>>>>> backupRepo/main
            if (activity.includes('face') && !teacherDetectionSettings.faceDetection) return false;
            if (activity.includes('gaze') && !teacherDetectionSettings.gazeDetection) return false;
            if (activity.includes('phone') && !teacherDetectionSettings.phoneDetection) return false;
            if (activity.includes('mouth') && !teacherDetectionSettings.mouthDetection) return false;
            if (activity.includes('Multiple') && !teacherDetectionSettings.multiplePeopleDetection) return false;
            if (activity.includes('AUDIO') && !teacherDetectionSettings.audioDetection) return false;
            if (activity.includes('GESTURE') && !teacherDetectionSettings.handGestureDetection) return false;
            if (activity.includes('TAB') && !teacherDetectionSettings.tabSwitchDetection) return false;
            if (activity.includes('SCREENSHOT') && !teacherDetectionSettings.screenshotDetection) return false;
            if (activity.includes('NO FACE') && !teacherDetectionSettings.faceDetection) return false;
            if (activity.includes('LOW ATTENTION') && !teacherDetectionSettings.attentionDetection) return false;
            return true;
<<<<<<< HEAD
          }
        });
=======
          });
>>>>>>> backupRepo/main
          
          filteredAlerts.forEach(activity => {
            onProctoringAlert({
              message: activity,
              type: activity.includes('phone') || activity.includes('Multiple') || activity.includes('TAB') ? 'danger' : 'warning',
              severity: activity.includes('phone') || activity.includes('Multiple') || activity.includes('TAB') ? 'high' : 'medium',
              timestamp: new Date().toLocaleTimeString(),
              detectionType: getDetectionTypeFromActivity(activity)
            });
          });
        }
      }
    } catch (error) {
      console.error('Proctoring capture error:', error);
    }
<<<<<<< HEAD



    
  }, [requiresCamera, examId, onProctoringAlert, cameraState.isConnected, camOn, teacherDetectionSettings, socketRef, tabSwitchCount, windowBlurCount, microphoneActive, isSpeaking]);
  
  // Sa CameraComponent, dagdag ng useEffect:
useEffect(() => {
  if (examType === 'asynchronous' && requiresCamera) {
    console.log('🔒 Async exam - Strict camera monitoring enforced');
    
    // Prevent camera from being turned off
    if (!camOn && cameraState.isConnected) {
      console.log('⚠️ Attempt to disable camera in async exam - REJECTING');
      // Force camera back on
      toggleCam(); // This will turn it back on
      
      // Send alert
      onProctoringAlert({
        message: '⚠️ Camera cannot be disabled in async exams',
        type: 'danger',
        severity: 'high',
        timestamp: new Date().toLocaleTimeString(),
        detectionType: 'camera_disabled_attempt'
      });
    }
  }
}, [camOn, examType, requiresCamera, cameraState.isConnected, onProctoringAlert]);


=======
  }, [requiresCamera, examId, onProctoringAlert, cameraState.isConnected, camOn, teacherDetectionSettings, socketRef, tabSwitchCount, windowBlurCount, microphoneActive, isSpeaking]);
  
>>>>>>> backupRepo/main
  const startProctoring = useCallback(() => {
    if (!requiresCamera || !cameraState.isConnected) return;
    captureIntervalRef.current = setInterval(captureFrame, 3000);
    console.log('📹 Proctoring started - capturing frames every 3 seconds');
  }, [requiresCamera, captureFrame, cameraState.isConnected]);
  
  const stopProctoring = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
      console.log('🛑 Proctoring stopped');
    }
  }, []);

  const initializeCamera = useCallback(async () => {
    if (!requiresCamera) return;

    try {
      setCameraState(prev => ({ ...prev, isInitializing: true, error: '' }));

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 15, max: 30 },
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous'
        },
        audio: false
      });
      
      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      const videoElement = videoRef.current;
      videoElement.srcObject = stream;
      videoElement.style.transform = 'scaleX(-1)';

      await videoElement.play();

      setCameraState(prev => ({
        ...prev,
        isConnected: true,
        isInitializing: false,
        hasCamera: true,
        error: ''
      }));
      
      onCameraStateChange?.(true);
      startProctoring();

    } catch (error) {
      console.error('Camera initialization failed:', error);
      
      let userMessage = 'Camera access failed';
      if (error.name === 'NotAllowedError') userMessage = 'Camera permission denied';
      else if (error.name === 'NotFoundError') userMessage = 'No camera found';
      else if (error.name === 'NotReadableError') userMessage = 'Camera is busy';
      
      setCameraState(prev => ({
        ...prev,
        isConnected: false,
        isInitializing: false,
        error: userMessage
      }));
      onCameraStateChange?.(false);
    }
  }, [requiresCamera, onCameraStateChange, startProctoring]);

  useEffect(() => {
    if (!requiresCamera) return;

    let mounted = true;

    const initCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        if (mounted) {
          setCameraState(prev => ({ ...prev, hasCamera: cameras.length > 0 }));
        }

        if (cameras.length > 0 && mounted) {
          await initializeCamera();
        } else if (mounted) {
          setCameraState(prev => ({ 
            ...prev, 
            error: 'No camera found', 
            isInitializing: false 
          }));
        }
      } catch (error) {
        if (mounted) {
          setCameraState(prev => ({ 
            ...prev, 
            error: 'Camera setup failed', 
            isInitializing: false 
          }));
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      stopProctoring();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [requiresCamera, initializeCamera, stopProctoring]);

  const toggleCam = () => {
    if (!streamRef.current) return;
    
    const videoTracks = streamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const newCamState = !camOn;
      videoTracks[0].enabled = newCamState;
      setCamOn(newCamState);
      onCameraStateChange?.(newCamState);
      
      if (newCamState) {
        startProctoring();
      } else {
        stopProctoring();
      }
    }
  };

  const retryCamera = async () => {
    setCameraState(prev => ({ ...prev, error: '', isInitializing: true }));
    await initializeCamera();
  };

  if (!requiresCamera) return null;

  return (
    <div className="camera-section">
      <div className="camera-header">
        <div className="user-info">
          <span className="user-name">Camera</span>
          <span className={`detection-status ${cameraState.isConnected ? 'normal' : 'bad'}`}>
            {cameraState.isConnected ? '📹 Active' : '📹 Off'}
          </span>
          {cameraState.isConnected && camOn && (
            <span className="proctoring-status">🔍 Monitoring</span>
          )}
        </div>
        <div className="camera-controls-mini">
          <button 
            className={`control-icon ${camOn ? 'active' : ''}`}
            onClick={toggleCam}
            disabled={cameraState.isInitializing || !cameraState.isConnected}
          >
            {camOn ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98z"/>
                <path d="M4 6v12h12V6H4zm11.58 2.08l1.42-1.42 1.42 1.42 1.42-1.42 1.42 1.42-1.42 1.42 1.42 1.42-1.42 1.42-1.42-1.42-1.42 1.42-1.42-1.42 1.42-1.42-1.42-1.42z" 
                  fill="red"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="camera-preview">
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          className="camera-video"
          style={{ 
            display: (cameraState.isConnected && camOn) ? 'block' : 'none'
          }}
        />
        
        {(!cameraState.isConnected || !camOn) ? (
          <div className="camera-offline">
            <div className="offline-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#666">
                <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98z"/>
              </svg>
            </div>
            <p>{cameraState.error || 'Camera is off'}</p>
            {cameraState.isInitializing && (
              <div className="initializing-message">
                <div className="loading-spinner-small"></div>
                <span>Starting camera...</span>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {cameraState.error && (
        <div className="camera-error-footer">
          <button className="retry-btn" onClick={retryCamera}>🔄 Retry Camera</button>
          <span className="error-message">{cameraState.error}</span>
        </div>
      )}
    </div>
  );
});

// ==================== HEADER ALERTS COMPONENT ====================
const HeaderAlerts = React.memo(({ alerts }) => {
  if (alerts.length === 0) return null;

  const latestAlerts = alerts.slice(0, 2);

  return (
    <div className="header-alerts">
      {latestAlerts.map((alert) => (
        <div key={alert.id} className={`alert-text ${
          alert.type || 
          (alert.message?.includes('TAB') || alert.detectionType?.includes('tab_switch') ? 'danger' : 
           alert.message?.includes('AUDIO') || alert.detectionType?.includes('audio') ? 'warning' : 
           alert.message?.includes('GESTURE') || alert.detectionType?.includes('gesture') ? 'warning' : 
           alert.message?.includes('SCREENSHOT') || alert.detectionType?.includes('screenshot') ? 'danger' : 'warning')
        }`}>
          {alert.detectionType?.includes('audio') && '🎤 '}
          {alert.detectionType?.includes('gesture') && '🤚 '}
          {alert.detectionType?.includes('tab_switch') && '💻 '}
          {alert.detectionType?.includes('screenshot') && '📸 '}
          {alert.message}
        </div>
      ))}
    </div>
  );
});

// ==================== PROCTORING ALERTS PANEL ====================
const ProctoringAlertsPanel = React.memo(({ alerts, isOpen, onToggle }) => {
  if (!isOpen) return null;

  const alertCounts = {
    audio: alerts.filter(alert => 
      alert.detectionType?.includes('audio') || alert.message?.includes('AUDIO')
    ).length,
    gesture: alerts.filter(alert => 
      alert.detectionType?.includes('gesture') || alert.message?.includes('GESTURE')
    ).length,
    tab: alerts.filter(alert => 
      alert.detectionType?.includes('tab_switch') || alert.message?.includes('TAB')
    ).length,
    screenshot: alerts.filter(alert => 
      alert.detectionType?.includes('screenshot') || alert.message?.includes('SCREENSHOT')
    ).length,
    total: alerts.length
  };

  return (
    <div className="proctoring-alerts-panel">
      <div className="alerts-panel-header">
        <h3>📊 Proctoring Alerts</h3>
        <button className="close-alerts-btn" onClick={onToggle}>✕</button>
      </div>
      
      <div className="alert-summary-cards">
        <div className="summary-card audio">
          <span className="summary-icon">🎤</span>
          <span className="summary-count">{alertCounts.audio}</span>
          <span className="summary-label">Audio Alerts</span>
        </div>
        <div className="summary-card gesture">
          <span className="summary-icon">🤚</span>
          <span className="summary-count">{alertCounts.gesture}</span>
          <span className="summary-label">Gesture Alerts</span>
        </div>
        <div className="summary-card tab">
          <span className="summary-icon">💻</span>
          <span className="summary-count">{alertCounts.tab}</span>
          <span className="summary-label">Tab Alerts</span>
        </div>
        <div className="summary-card screenshot">
          <span className="summary-icon">📸</span>
          <span className="summary-count">{alertCounts.screenshot}</span>
          <span className="summary-label">Screenshot Alerts</span>
        </div>
      </div>
      
      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">✅</div>
            <p>No proctoring alerts</p>
            <small>Good attention detected</small>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${alert.type || 'warning'}`}>
              <div className="alert-icon">
                {alert.detectionType?.includes('audio') ? '🎤' :
                 alert.detectionType?.includes('gesture') ? '🤚' :
                 alert.detectionType?.includes('tab_switch') ? '💻' :
                 alert.detectionType?.includes('screenshot') ? '📸' :
                 alert.type === 'warning' ? '⚠️' : 
                 alert.type === 'danger' ? '🚨' : 'ℹ️'}
              </div>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-meta">
                  <span className="alert-time">{alert.timestamp}</span>
                  {alert.detectionType && (
                    <span className="alert-type">{alert.detectionType}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="alerts-summary">
        <span className="total-alerts">Total Alerts: {alertCounts.total}</span>
        {alertCounts.audio > 0 && <span className="audio-count">🎤: {alertCounts.audio}</span>}
        {alertCounts.gesture > 0 && <span className="gesture-count">🤚: {alertCounts.gesture}</span>}
        {alertCounts.tab > 0 && <span className="tab-count">💻: {alertCounts.tab}</span>}
        {alertCounts.screenshot > 0 && <span className="screenshot-count">📸: {alertCounts.screenshot}</span>}
      </div>
    </div>
  );
});

// ==================== CHAT COMPONENT ====================
const ChatComponent = React.memo(({ 
  messages, 
  newMessage, 
  setNewMessage, 
  handleSendMessage, 
  showChat, 
  toggleChat,
  unreadCount 
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!showChat) return null;

  return (
    <div className="student-chat-panel">
      <div className="chat-header">
        <h3>💬 Exam Chat</h3>
        <button className="close-chat-btn" onClick={toggleChat}>✕</button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="chat-icon">💬</div>
            <p>No messages yet</p>
            <small>Ask questions to your teacher</small>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.sender === 'student' ? 'sent' : 'received'}`}>
              <div className="message-header">
                <span className="sender-name">
                  {message.sender === 'student' ? 'You' : message.senderName}
                </span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message to teacher..."
          className="chat-input"
          maxLength={500}
        />
        <button 
          type="submit" 
          className="send-message-btn"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
});

// ==================== MAIN STUDENT QUIZ COMPONENT ====================
export default function StudentQuizPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    requiresCamera = false,
    requiresMicrophone = false,
    examTitle = 'Quiz',
    className = 'Class'
  } = location.state || {};

  // ==================== STATE MANAGEMENT ====================
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [error, setError] = useState('');
  const [examStarted, setExamStarted] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState(0);

  // ✅ TIMER STATE
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // ✅ DETECTION SETTINGS
  const [teacherDetectionSettings, setTeacherDetectionSettings] = useState({
    faceDetection: true,
    gazeDetection: true,
    phoneDetection: true,
    mouthDetection: true,
    multiplePeopleDetection: true,
    audioDetection: true,
    handGestureDetection: true,
    tabSwitchDetection: true,
    screenshotDetection: true,
    attentionDetection: true
  });

  const [studentAttempts, setStudentAttempts] = useState({
    currentAttempts: 0,
    maxAttempts: 10,
    attemptsLeft: 10,
    history: []
  });

  // ✅ MICROPHONE STATE
  const [micState, setMicState] = useState({
    isConnected: false,
    isInitializing: false,
    error: '',
    hasMicrophone: false,
    isMuted: true,
    isSpeaking: false
  });

  // Permission & Monitoring State
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [microphoneActive, setMicrophoneActive] = useState(false);
  const [proctoringAlerts, setProctoringAlerts] = useState([]);
  const [peerConnection, setPeerConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [cameraRequested, setCameraRequested] = useState(false);
  const [isSharingCamera, setIsSharingCamera] = useState(false);
  const [teacherSocketId, setTeacherSocketId] = useState(null);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
<<<<<<< HEAD
  const timerRef = useRef(null);
const lastTimerUpdateRef = useRef(0);
const isAutoSubmitWarningShown = useRef(false);

const [examType, setExamType] = useState('asynchronous'); // Default to async




// ==================== TIMER PERSISTENCE FUNCTIONS ====================
const saveTimerToLocalStorage = (time, isRunning) => {
  const timerData = {
    examId: examId,
    timeLeft: time,
    isTimerRunning: isRunning,
    lastUpdated: new Date().toISOString(),
    savedAt: Date.now()
  };
  
  localStorage.setItem(`timer-${examId}`, JSON.stringify(timerData));
  console.log('💾 Timer saved to localStorage:', {
    time: formatTime(time),
    running: isRunning
  });
};

const loadTimerFromLocalStorage = () => {
  try {
    const savedTimer = localStorage.getItem(`timer-${examId}`);
    if (savedTimer) {
      const timerData = JSON.parse(savedTimer);
      console.log('💾 Loaded timer from localStorage:', timerData);
      return timerData;
    }
  } catch (error) {
    console.error('Error loading timer from localStorage:', error);
  }
  return null;
};

const clearTimerFromLocalStorage = () => {
  localStorage.removeItem(`timer-${examId}`);
  console.log('🧹 Timer cleared from localStorage');
};

// ==================== FORMAT TIME FUNCTION ====================
const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '00:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}


  // ==================== QUIZ MANAGEMENT ====================

// StudentQuizPage.jsx - UPDATE loadQuiz function
const loadQuiz = useCallback(async () => {
  try {
    setLoading(true);
    setError('');
    const response = await getQuizForStudent(examId);
    
    if (response.success) {
      const quizData = response.data;
      setQuiz(quizData);
      
      // ✅ SET EXAM TYPE
      const examTypeFromData = quizData.examType || 'asynchronous';
      setExamType(examTypeFromData);
      
      console.log('🔍 Exam Type Detected:', examTypeFromData);
      console.log('📊 Quiz Data for Timer:', {
        timerSettings: quizData.timerSettings,
        timeLimit: quizData.timeLimit,
        examType: quizData.examType,
        totalSeconds: quizData.timerSettings?.totalSeconds
      });
      
      // ✅ CALCULATE TOTAL SECONDS - USE PRIORITY ORDER
      let totalSeconds = 0;
      
      // Priority 1: Use timerSettings.totalSeconds (direct seconds)
      if (quizData.timerSettings?.totalSeconds) {
        totalSeconds = quizData.timerSettings.totalSeconds;
        console.log('⏰ Using timerSettings.totalSeconds:', totalSeconds);
      }
      // Priority 2: Use timeLimit (ALWAYS IN MINUTES - convert to seconds)
      else if (quizData.timeLimit) {
        totalSeconds = quizData.timeLimit * 60; // ALWAYS convert minutes to seconds
        console.log('⏰ Using timeLimit (minutes converted to seconds):', {
          minutes: quizData.timeLimit,
          seconds: totalSeconds
        });
      }
      // Priority 3: Default fallback (1 hour)
      else {
        totalSeconds = 3600; // 1 hour default
        console.log('⚠️ No timer found, using default 1 hour');
      }
      
      console.log('✅ Final timer calculation:', {
        seconds: totalSeconds,
        formatted: formatTime(totalSeconds),
        examType: examTypeFromData
      });
      
      // ✅ SET TIMER BASED ON EXAM TYPE
      if (examTypeFromData === 'asynchronous') {
        // ASYNC EXAMS: AUTO-START IMMEDIATELY
        console.log('⏰ Async exam detected - AUTO-STARTING timer');
        setTimeLeft(totalSeconds);
        setIsTimerRunning(true);
        
        // Save to localStorage immediately
        saveTimerToLocalStorage(totalSeconds, true);
        
      } else if (examTypeFromData === 'live-class') {
        // LIVE CLASS: Wait for teacher
        console.log('🎥 Live class exam - Waiting for teacher timer');
        setTimeLeft(0);
        setIsTimerRunning(false);
      }
      
      // Load answers as before
      const initialAnswers = {};
      if (quizData.questions) {
        quizData.questions.forEach((question, index) => {
          if (question.type === 'checkboxes') {
            initialAnswers[index] = [];
          } else {
            initialAnswers[index] = '';
          }
        });
      }
      setAnswers(initialAnswers);

    } else {
      setError(response.message || 'Failed to load quiz');
    }
  } catch (error) {
    console.error('Error loading quiz:', error);
    setError('Error loading quiz. Please try again.');
  } finally {
    setLoading(false);
  }
}, [examId]);
=======
  const proctoringIntervalRef = useRef(null); // ✅ ADDED

  const [examType, setExamType] = useState('asynchronous'); // Default to async

  // ==================== TIMER PERSISTENCE FUNCTIONS ====================
  const saveTimerToLocalStorage = (time, isRunning) => {
    const now = Date.now();
    const lastSave = localStorage.getItem(`last-save-${examId}`);
    
    if (lastSave && now - parseInt(lastSave) < 5000) {
      return; // Skip save if less than 5 seconds since last save
    }
    
    const timerData = {
      examId: examId,
      timeLeft: time,
      isTimerRunning: isRunning,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(`timer-${examId}`, JSON.stringify(timerData));
    localStorage.setItem(`last-save-${examId}`, now.toString());
    
    console.log('💾 Timer saved to localStorage:', timerData);
  };

  const loadTimerFromLocalStorage = () => {
    try {
      const savedTimer = localStorage.getItem(`timer-${examId}`);
      if (savedTimer) {
        const timerData = JSON.parse(savedTimer);
        console.log('💾 Loaded timer from localStorage:', timerData);
        return timerData;
      }
    } catch (error) {
      console.error('Error loading timer from localStorage:', error);
    }
    return null;
  };

  const clearTimerFromLocalStorage = () => {
    localStorage.removeItem(`timer-${examId}`);
    console.log('🧹 Timer cleared from localStorage');
  };

  // ==================== QUIZ MANAGEMENT ====================
  const loadQuiz = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getQuizForStudent(examId);
      
      if (response.success) {
        const quizData = response.data;
        setQuiz(quizData);
        
        // ✅ SET EXAM TYPE
        const examTypeFromData = quizData.examType || 'asynchronous';
        setExamType(examTypeFromData);
        
        // ✅ FIX: ASYNCHRONOUS EXAM - AUTO-START TIMER
        if (examTypeFromData === 'asynchronous') {
          // For async exams, use teacher's timer settings
          if (quizData.timerSettings?.totalSeconds) {
            setTimeLeft(quizData.timerSettings.totalSeconds);
            setIsTimerRunning(true); // ✅ AUTO-START FOR ASYNC
            console.log('⏰ Async exam - Auto-starting timer:', {
              seconds: quizData.timerSettings.totalSeconds,
              formatted: formatTime(quizData.timerSettings.totalSeconds)
            });
          } else if (quizData.timeLimit) {
            // Fallback: convert minutes to seconds
            const teacherTimeInSeconds = quizData.timeLimit * 60;
            setTimeLeft(teacherTimeInSeconds);
            setIsTimerRunning(true); // ✅ AUTO-START FOR ASYNC
            console.log('⏰ Async exam - Auto-starting timer (converted):', {
              minutes: quizData.timeLimit,
              seconds: teacherTimeInSeconds
            });
          } else {
            // Default fallback if no timer from teacher
            setTimeLeft(60 * 60); // 1 hour default
            setIsTimerRunning(true); // ✅ AUTO-START FOR ASYNC
            console.log('⏰ Async exam - Using default timer (1 hour)');
          }
        } else if (examTypeFromData === 'live-class') {
          // For live classes, wait for teacher to start
          setTimeLeft(0); // No timer for live class
          setIsTimerRunning(false);
          console.log('🎥 Live class exam - Waiting for teacher');
        }
        
        // Load answers as before
        const initialAnswers = {};
        if (quizData.questions) {
          quizData.questions.forEach((question, index) => {
            if (question.type === 'checkboxes') {
              initialAnswers[index] = [];
            } else {
              initialAnswers[index] = '';
            }
          });
        }
        setAnswers(initialAnswers);

      } else {
        setError(response.message || 'Failed to load quiz');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Error loading quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [examId]);
>>>>>>> backupRepo/main

  const handleAnswerChange = useCallback((questionIndex, value) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionIndex]: value };
      
      const count = Object.values(newAnswers).filter(answer => 
        answer && (typeof answer === 'string' ? answer.trim() !== '' : Array.isArray(answer) ? answer.length > 0 : true)
      ).length;
      setAnsweredCount(count);
      
      return newAnswers;
    });
  }, []);

  const handleCheckboxChange = useCallback((questionIndex, option, isChecked) => {
    const currentAnswers = Array.isArray(answers[questionIndex]) ? answers[questionIndex] : [];
    const newAnswers = isChecked
      ? [...currentAnswers, option]
      : currentAnswers.filter(opt => opt !== option);
    handleAnswerChange(questionIndex, newAnswers);
  }, [answers, handleAnswerChange]);

<<<<<<< HEAD
// StudentQuizPage.jsx - UPDATE handleSubmitQuiz
// StudentQuizPage.jsx - COMPLETE FIXED handleSubmitQuiz
const handleSubmitQuiz = async (isAutoSubmit = false) => {
  // ✅ PREVENT MULTIPLE SUBMISSIONS
  if (submitting) {
    console.log('⚠️ Already submitting, skipping duplicate request');
    return;
  }
  
  if (!isAutoSubmit) {
    if (!window.confirm('Are you sure you want to submit your answers?')) return;
  }
  
  // Check permissions
  if ((requiresCamera && !cameraActive) || (requiresMicrophone && !microphoneActive)) {
    const proceed = isAutoSubmit || window.confirm(
      'Monitoring is not fully active. This may be reported to your instructor. Continue with submission?'
    );
    if (!proceed) return;
  }

  setSubmitting(true);
  console.log('📤 Starting quiz submission...', {
    examId,
    answersCount: Object.keys(answers).length,
    isAutoSubmit,
    examType
  });
  
  try {
    // ✅ PREPARE ANSWERS IN CORRECT FORMAT
    const formattedAnswers = Object.entries(answers).map(([questionIndex, answer]) => ({
      questionIndex: parseInt(questionIndex),
      answer: answer,
      questionType: quiz?.questions?.[questionIndex]?.type || 'unknown'
    }));
    
    console.log('📦 Prepared answers for submission:', {
      formattedAnswersCount: formattedAnswers.length,
      sampleAnswer: formattedAnswers[0]
    });
    
    // ✅ SUBMIT USING API FUNCTION
    const submissionResponse = await submitQuizAnswers(examId, formattedAnswers);
    
    console.log('📊 Submission API response:', submissionResponse);
    
    if (submissionResponse.success) {
      console.log('✅ Quiz answers submitted successfully');
      
      // ✅ CLEAR TIMER FROM LOCALSTORAGE
      clearTimerFromLocalStorage();
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // ✅ MARK EXAM AS COMPLETED IN BACKEND
      try {
        const completionResponse = await api.post(`/exams/${examId}/complete`, {
          score: submissionResponse.data?.score || 0,
          maxScore: submissionResponse.data?.maxScore || quiz?.questions?.length || 0,
          percentage: submissionResponse.data?.percentage || 0,
          answers: formattedAnswers,
          submittedAt: new Date().toISOString(),
          isAutoSubmitted: isAutoSubmit,
          examType: examType
        });
        console.log("✅ Exam marked as completed:", completionResponse.data);
      } catch (completionError) {
        console.error("⚠️ Failed to mark exam as completed:", completionError);
        // Continue anyway since answers were submitted
      }

      // ✅ SHOW SUCCESS MESSAGE
      if (isAutoSubmit) {
        alert('⏰ Time is up! Your answers have been automatically submitted.');
      } else {
        alert('✅ Answers submitted successfully! Your exam has been moved to "Done" section.');
      }
      
      // ✅ CLEANUP RESOURCES
      cleanupResources();
      
      // ✅ NAVIGATE TO DASHBOARD
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            examCompleted: true,
            examId: examId,
            message: isAutoSubmit ? 'Time expired - Quiz auto-submitted' : 'Quiz completed successfully!',
            isAutoSubmitted: isAutoSubmit,
            score: submissionResponse.data?.score,
            percentage: submissionResponse.data?.percentage
          }
        });
      }, 2000);
      
    } else {
      // ❌ HANDLE SUBMISSION FAILURE
      console.error('❌ Submission failed:', submissionResponse.message);
      
      // Try alternative submission method
      await tryAlternativeSubmission(examId, formattedAnswers, isAutoSubmit);
    }
    
  } catch (error) {
    console.error('❌ CRITICAL Submission error:', error);
    
    // ❌ USER-FRIENDLY ERROR HANDLING
    let errorMessage = 'Failed to submit answers. ';
    
    if (error.response) {
      // Server responded with error
      console.error('Server error response:', error.response.data);
      errorMessage += `Server error: ${error.response.status}. `;
      
      if (error.response.status === 400) {
        errorMessage += 'Invalid request format.';
      } else if (error.response.status === 404) {
        errorMessage += 'Exam not found.';
      } else if (error.response.status === 403) {
        errorMessage += 'Not authorized.';
      } else if (error.response.status === 500) {
        errorMessage += 'Server error. Please contact instructor.';
      }
    } else if (error.request) {
      // No response received
      console.error('No response from server:', error.request);
      errorMessage += 'No response from server. Check your internet connection.';
    } else {
      // Other errors
      errorMessage += error.message || 'Unknown error occurred.';
    }
    
    alert(`❌ ${errorMessage}`);
    
    // ✅ RETRY LOGIC FOR AUTO-SUBMIT
    if (isAutoSubmit) {
      console.log('🔄 Auto-submit failed, will retry in background...');
      await retryAutoSubmit(examId, answers, isAutoSubmit);
    }
  } finally {
    setSubmitting(false);
  }
};

// ✅ HELPER FUNCTION: CLEANUP RESOURCES
const cleanupResources = () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    console.log('🔴 Local stream stopped');
  }
  
  if (peerConnectionRef.current) {
    peerConnectionRef.current.close();
    peerConnectionRef.current = null;
    console.log('🔴 WebRTC connection closed');
  }
  
  if (socketRef.current) {
    socketRef.current.disconnect();
    socketRef.current = null;
    console.log('🔴 Socket disconnected');
  }
};

// ✅ HELPER FUNCTION: ALTERNATIVE SUBMISSION METHOD
const tryAlternativeSubmission = async (examId, formattedAnswers, isAutoSubmit) => {
  try {
    console.log('🔄 Trying alternative submission method...');
    
    // Try direct fetch as alternative
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/exams/${examId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ answers: formattedAnswers })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Alternative submission succeeded:', data);
      
      alert('✅ Answers submitted successfully via alternative method!');
      
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            examCompleted: true,
            examId: examId,
            message: 'Submitted via alternative method'
          }
        });
      }, 2000);
    } else {
      throw new Error(`Alternative submission failed: ${response.status}`);
    }
  } catch (altError) {
    console.error('❌ Alternative submission also failed:', altError);
    
    // Save answers locally as last resort
    saveAnswersLocally(examId, formattedAnswers, isAutoSubmit);
  }
};

// ✅ HELPER FUNCTION: SAVE ANSWERS LOCALLY
const saveAnswersLocally = (examId, formattedAnswers, isAutoSubmit) => {
  const backupData = {
    examId: examId,
    answers: formattedAnswers,
    timestamp: new Date().toISOString(),
    isAutoSubmitted: isAutoSubmit,
    examType: examType
  };
  
  localStorage.setItem(`exam-backup-${examId}`, JSON.stringify(backupData));
  console.log('💾 Answers saved locally as backup:', backupData);
  
  alert('⚠️ Answers saved locally. Please contact your instructor. ' +
        'Your answers have been saved and can be retrieved later.');
  
  setTimeout(() => {
    navigate('/dashboard', { 
      state: { 
        examCompleted: false,
        examId: examId,
        message: 'Answers saved locally - contact instructor',
        hasBackup: true
      }
    });
  }, 3000);
};

// ✅ HELPER FUNCTION: RETRY AUTO-SUBMIT
const retryAutoSubmit = async (examId, answers, isAutoSubmit) => {
  // Save current state for retry
  const retryData = {
    examId,
    answers: Object.entries(answers).map(([idx, ans]) => ({
      questionIndex: parseInt(idx),
      answer: ans
    })),
    retryCount: 0,
    maxRetries: 3
  };
  
  localStorage.setItem(`retry-submit-${examId}`, JSON.stringify(retryData));
  
  // Show retry message
  alert('🔄 Auto-submit failed. System will retry in background. ' +
        'Do not close this page until submission succeeds.');
  
  // Set up retry mechanism
  const retryInterval = setInterval(async () => {
    const savedRetry = localStorage.getItem(`retry-submit-${examId}`);
    if (!savedRetry) {
      clearInterval(retryInterval);
      return;
    }
    
    const retryInfo = JSON.parse(savedRetry);
    retryInfo.retryCount++;
    
    if (retryInfo.retryCount <= retryInfo.maxRetries) {
      console.log(`🔄 Retry ${retryInfo.retryCount}/${retryInfo.maxRetries}...`);
      
      try {
        await submitQuizAnswers(examId, retryInfo.answers);
        
        // Success!
        clearInterval(retryInterval);
        localStorage.removeItem(`retry-submit-${examId}`);
        
        alert('✅ Answers submitted successfully on retry!');
        navigate('/dashboard');
        
      } catch (retryError) {
        console.error(`Retry ${retryInfo.retryCount} failed:`, retryError);
        localStorage.setItem(`retry-submit-${examId}`, JSON.stringify(retryInfo));
      }
    } else {
      // Max retries reached
      clearInterval(retryInterval);
      localStorage.removeItem(`retry-submit-${examId}`);
      
      saveAnswersLocally(examId, retryInfo.answers, true);
    }
  }, 10000); // Retry every 10 seconds
};

// ==================== ACCURATE TAB SWITCHING DETECTION ====================
// ✅ ACCURATE TAB SWITCHING DETECTION
useEffect(() => {
  let lastFocusTime = Date.now();
  let isWindowFocused = true;
  let debounceTimer = null;
  
  const handleVisibilityChange = () => {
    // ✅ CHECK IF TAB SWITCH DETECTION IS ENABLED BY TEACHER
    if (!teacherDetectionSettings.tabSwitchDetection) {
      console.log('🛑 Tab switch detection is DISABLED by teacher - ignoring');
      return;
    }
    
    if (document.hidden) {
      const now = Date.now();
      const timeSinceLastSwitch = now - lastTabSwitchTime;
      
      // ✅ PREVENT RAPID MULTIPLE DETECTIONS - minimum 2 seconds between detections
      if (timeSinceLastSwitch > 2000 && examStarted && permissionsGranted) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        setLastTabSwitchTime(now);
        
        console.log('💻 Tab switch detected! Count:', newCount, 'Time since last:', timeSinceLastSwitch + 'ms');
        
        // ✅ SEND TO SERVER WITH COMPLETE DATA
        if (socketRef.current) {
          const alertData = {
            examId: examId,
            studentSocketId: socketRef.current.id,
            timestamp: new Date().toISOString(),
            count: newCount,
            timeSinceLast: timeSinceLastSwitch,
            type: 'danger',
            severity: 'high',
            message: `💻 Tab switch detected - Student looked away from exam (Count: ${newCount})`
          };
          
          socketRef.current.emit('tab-switch-detected', alertData);
          
          // ✅ ALSO SEND AS PROCTORING ALERT FOR BACKUP
          socketRef.current.emit('forward-proctoring-alert', {
            ...alertData,
            detectionType: 'tab_switching'
          });
        }
        
        // ✅ LOCAL ALERT
        const newAlert = {
          id: Date.now(),
          message: `💻 Tab switch detected (${newCount} times) - Focus on the exam!`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'danger',
          severity: 'high',
          detectionType: 'tab_switching'
        };
        
        setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
        
        // ✅ UPDATE LOCAL ATTEMPTS
        setStudentAttempts(prev => {
          const newAttempts = prev.currentAttempts + 0.5; // Tab switch = 0.5 attempt
          const attemptsLeft = Math.max(0, prev.maxAttempts - newAttempts);
          
          const updated = {
            ...prev,
            currentAttempts: newAttempts,
            attemptsLeft: attemptsLeft,
            history: [
              ...prev.history,
              {
                timestamp: new Date().toISOString(),
                violation: 'tab_switching',
                message: `Tab switch detected (${newCount} times)`,
                attemptsLeft: attemptsLeft,
                timeSinceLast: timeSinceLastSwitch
              }
            ].slice(-10)
          };
          
          // ✅ WARNINGS
          if (attemptsLeft <= 3 && attemptsLeft > 0) {
            alert(`⚠️ Warning: Only ${attemptsLeft} attempt(s) left! Tab switching detected.`);
          }
          
          if (attemptsLeft <= 0) {
            alert('❌ You have been disconnected due to excessive violations.');
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          }
          
          return updated;
        });
      } else {
        console.log('⏰ Tab switch ignored - too soon since last detection:', timeSinceLastSwitch + 'ms');
      }
    } else {
      lastFocusTime = Date.now();
      isWindowFocused = true;
    }
  };

  if (examStarted && permissionsGranted) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log('🔍 Tab switching monitoring ACTIVATED');
  }

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };
}, [examId, examStarted, permissionsGranted, tabSwitchCount, lastTabSwitchTime, teacherDetectionSettings.tabSwitchDetection]);
// ==================== TIMER MANAGEMENT ====================
// StudentQuizPage.jsx - UPDATE timer effect for better auto-submit
useEffect(() => {
  console.log('⏰ Timer effect running:', { 
    isTimerRunning, 
    timeLeft,
    examType 
  });
  
  if (isTimerRunning && timeLeft > 0) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          return 0;
        }
        
        const newTime = prev - 1;
        
        // ✅ AUTO-SUBMIT WHEN TIME REACHES 0
        if (newTime <= 0) {
          console.log('⏰ TIME UP! Triggering auto-submit...');
          clearInterval(timerRef.current);
          
          // ✅ FORCE SUBMIT IMMEDIATELY
          setTimeout(() => {
            handleSubmitQuiz(true);
          }, 100); // Small delay to ensure state is updated
          
          return 0;
        }
        
        // ✅ WARNINGS
        if (newTime === 60) { // 1 minute left
          console.log('⚠️ 1 minute remaining');
          if (!isAutoSubmitWarningShown.current) {
            alert('⚠️ 1 minute remaining! Answers will be auto-submitted.');
            isAutoSubmitWarningShown.current = true;
          }
        }
        if (newTime === 300) { // 5 minutes left
          console.log('⏰ 5 minutes remaining');
          alert('⏰ 5 minutes remaining! Please finish up.');
        }
        
        // Save progress every 30 seconds for async exams
        if (newTime % 30 === 0 && examType === 'asynchronous') {
          saveTimerToLocalStorage(newTime, true);
          
          // Also save answers progress
          const progressData = {
            examId,
            answers,
            savedAt: new Date().toISOString(),
            timeLeft: newTime
          };
          localStorage.setItem(`exam-progress-${examId}`, JSON.stringify(progressData));
        }
        
        return newTime;
      });
    }, 1000);
    
    console.log('⏰ Timer interval started');
  } else {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('⏰ Timer interval cleared');
    }
  }

  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('⏰ Timer cleanup');
    }
  };
}, [isTimerRunning, timeLeft, examType]);

// ==================== LOAD TIMER FROM TEACHER ====================
// StudentQuizPage.jsx - UPDATE socket timer listeners
useEffect(() => {
  if (!socketRef.current) return;
  
  const handleTimerUpdate = (data) => {
    console.log('🕒 Student received timer update:', data);
    
    // ✅ IGNORE TEACHER TIMER UPDATES FOR ASYNC EXAMS
    if (examType === 'asynchronous') {
      console.log('🛑 Ignoring teacher timer for async exam - using local timer');
      return;
    }
    
    let receivedTime = data.timeLeft;
    
    // Convert minutes to seconds if needed
    if (receivedTime < 100 && receivedTime > 0) {
      console.log('🔄 Converting minutes to seconds:', receivedTime);
      receivedTime = receivedTime * 60;
    }
    
    setTimeLeft(receivedTime);
    setIsTimerRunning(data.isTimerRunning);
    
    // Save to localStorage
    saveTimerToLocalStorage(receivedTime, data.isTimerRunning);
    
    console.log('✅ Student timer synced:', {
      time: formatTime(receivedTime),
      running: data.isTimerRunning
    });
  };

  socketRef.current.on('exam-time-update', handleTimerUpdate);
  
  return () => {
    if (socketRef.current) {
      socketRef.current.off('exam-time-update', handleTimerUpdate);
    }
  };
}, [examStarted, examType]);

// ==================== REQUEST TIMER ON CONNECT ====================
useEffect(() => {
  if (socketRef.current && socketRef.current.connected && examStarted) {
    // Request current timer state from teacher
    setTimeout(() => {
      socketRef.current.emit('student-time-request', {
        studentSocketId: socketRef.current.id,
        roomId: `exam-${examId}`,
        examId: examId
      });
    }, 1000);
  }
}, [socketRef.current?.connected, examStarted, examId]);

=======
  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      if (!window.confirm('Are you sure you want to submit your answers?')) return;
    }
    
    if ((requiresCamera && !cameraActive) || (requiresMicrophone && !microphoneActive)) {
      const proceed = isAutoSubmit || window.confirm(
        'Monitoring is not fully active. This may be reported to your instructor. Continue with submission?'
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      console.log('📤 Submitting quiz answers...');
      
      const submissionResponse = await submitQuizAnswers(examId, answers);
      
      if (submissionResponse.success) {
        console.log('✅ Quiz answers submitted successfully');
        // ✅ CLEAR TIMER FROM LOCALSTORAGE
        clearTimerFromLocalStorage();

        try {
          // If you have an API endpoint to mark exam as completed
          // await api.post(`/exams/${examId}/complete`, {
          //   score: submissionResponse.data.score,
          //   maxScore: submissionResponse.data.maxScore,
          //   percentage: submissionResponse.data.percentage,
          //   answers: Object.entries(answers).map(([index, answer]) => ({
          //     questionIndex: parseInt(index),
          //     answer: answer
          //   }))
          // });
          console.log("✅ Exam marked as completed in backend");
        } catch (completionError) {
          console.error("❌ Failed to mark exam as completed:", completionError);
        }

        if (isAutoSubmit) {
          alert('⏰ Time is up! Your answers have been automatically submitted.');
        } else {
          alert('✅ Answers submitted successfully! Your exam has been moved to "Done" section.');
        }
        
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              examCompleted: true,
              examId: examId,
              message: isAutoSubmit ? 'Time expired - Quiz auto-submitted' : 'Quiz completed successfully!'
            }
          });
        }, 2000);
        
      } else {
        throw new Error(submissionResponse.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('❌ Failed to submit answers. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== ACCURATE TAB SWITCHING DETECTION ====================
  useEffect(() => {
    let lastFocusTime = Date.now();
    let isWindowFocused = true;
    let debounceTimer = null;

    const handleFocus = () => {
      const now = Date.now();
      const timeAway = now - lastFocusTime;
      
      // ✅ IGNORE SHORT ABSENCES (less than 1 second)
      if (timeAway > 1000 && !isWindowFocused) {
        console.log('🔍 Window focused after:', timeAway + 'ms');
        isWindowFocused = true;
        
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
      }
    };

    const handleBlur = () => {
      lastFocusTime = Date.now();
      isWindowFocused = false;
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        if (!isWindowFocused && examStarted && permissionsGranted) {
          const newCount = windowBlurCount + 1;
          setWindowBlurCount(newCount);
          console.log('🪟 Window blur detected (debounced)! Count:', newCount);
        }
      }, 500);
    };

    const handleVisibilityChange = () => {
      // ✅ CHECK IF TAB SWITCH DETECTION IS ENABLED BY TEACHER
      if (!teacherDetectionSettings.tabSwitchDetection) {
        console.log('🛑 Tab switch detection is DISABLED by teacher - ignoring');
        return;
      }

      if (document.hidden) {
        const now = Date.now();
        const timeSinceLastSwitch = now - lastTabSwitchTime;
        
        // ✅ PREVENT RAPID MULTIPLE DETECTIONS - minimum 2 seconds between detections
        if (timeSinceLastSwitch > 2000 && examStarted && permissionsGranted) {
          const newCount = tabSwitchCount + 1;
          setTabSwitchCount(newCount);
          setLastTabSwitchTime(now);
          
          console.log('💻 Tab switch detected! Count:', newCount, 'Time since last:', timeSinceLastSwitch + 'ms');
          
          // ✅ ONLY SEND TO SERVER IF TAB SWITCH DETECTION IS ENABLED
          if (socketRef.current && teacherDetectionSettings.tabSwitchDetection) {
            socketRef.current.emit('tab-switch-detected', {
              examId: examId,
              studentSocketId: socketRef.current.id,
              timestamp: new Date().toISOString(),
              count: newCount,
              timeSinceLast: timeSinceLastSwitch
            });
          }
          
          // ✅ ONLY SHOW ALERT AND COUNT ATTEMPTS IF TAB SWITCH DETECTION IS ENABLED
          if (teacherDetectionSettings.tabSwitchDetection) {
            const newAlert = {
              id: Date.now(),
              message: '💻 Tab switch detected - Focus on the exam!',
              timestamp: new Date().toLocaleTimeString(),
              type: 'danger',
              severity: 'high',
              detectionType: 'tab_switching'
            };
            
            setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
            
            setStudentAttempts(prev => {
              const newAttempts = prev.currentAttempts + 1;
              const attemptsLeft = Math.max(0, prev.maxAttempts - newAttempts);
              
              const updated = {
                ...prev,
                currentAttempts: newAttempts,
                attemptsLeft: attemptsLeft,
                history: [
                  ...prev.history,
                  {
                    timestamp: new Date().toISOString(),
                    violation: 'tab_switching',
                    message: 'Tab switch detected',
                    attemptsLeft: attemptsLeft,
                    timeSinceLast: timeSinceLastSwitch
                  }
                ].slice(-10)
              };
              
              if (attemptsLeft <= 3 && attemptsLeft > 0) {
                alert(`⚠️ Warning: Only ${attemptsLeft} attempt(s) left!`);
              }
              
              if (attemptsLeft <= 0) {
                alert('❌ You have been disconnected due to excessive violations.');
                setTimeout(() => {
                  navigate('/dashboard');
                }, 3000);
              }
              
              return updated;
            });
          } else {
            console.log('🛑 Tab switch detection disabled - not counting as attempt');
          }
        } else {
          console.log('⏰ Tab switch ignored - too soon since last detection:', timeSinceLastSwitch + 'ms');
        }
      } else {
        lastFocusTime = Date.now();
        isWindowFocused = true;
      }
    };

    if (examStarted && permissionsGranted) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      
      console.log('🔍 Accurate tab/window monitoring ACTIVATED');
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [examId, examStarted, permissionsGranted, tabSwitchCount, windowBlurCount, navigate, lastTabSwitchTime, teacherDetectionSettings.tabSwitchDetection]);
>>>>>>> backupRepo/main

  // ==================== PERMISSION HANDLERS ====================
  const handlePermissionsGranted = useCallback(() => {
    setPermissionsGranted(true);
    if (requiresCamera) setCameraActive(true);
    if (requiresMicrophone) setMicrophoneActive(true);
  }, [requiresCamera, requiresMicrophone]);

  const handleCancelExam = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

<<<<<<< HEAD


// Sa StudentQuizPage.jsx, baguhin ang handleExamStart:

const handleExamStart = useCallback(async () => {
  console.log('🎯 Starting exam, Type:', examType);
  
  // ✅ SIMPLE CHECK: Dapat naka-open ang camera at microphone
  try {
    if (requiresCamera) {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    if (requiresMicrophone) {
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      micStream.getTracks().forEach(track => track.stop());
    }
    
    // ✅ AFTER PERMISSIONS VERIFIED:
    
    // For live classes: Wait 5 seconds then auto-enter
    if (examType === 'live-class') {
      console.log('🎥 Live class - Waiting for 5 seconds...');
      
      // Show waiting message
      alert('✅ Permissions verified! Entering exam in 5 seconds...');
      
      setTimeout(() => {
        setExamStarted(true);
        setPermissionsGranted(true);
        loadQuiz();
        
        // Notify teacher student has entered
        if (socketRef.current) {
          socketRef.current.emit('student-entered-exam', {
            examId: examId,
            studentId: 'student-user',
            studentSocketId: socketRef.current.id
          });
        }
      }, 5000);
      
    } else {
      // For async quiz: Enter immediately
      setExamStarted(true);
      setPermissionsGranted(true);
      loadQuiz();
    }
    
  } catch (error) {
    console.error('❌ Permission denied:', error);
    
    if (requiresCamera && requiresMicrophone) {
      alert('❌ Camera AND Microphone are REQUIRED! Please enable both.');
    } else if (requiresCamera) {
      alert('❌ Camera is REQUIRED! Please enable camera.');
    } else if (requiresMicrophone) {
      alert('🎤 Microphone is REQUIRED! Please enable microphone.');
    }
  }
}, [requiresCamera, requiresMicrophone, examType, loadQuiz, examId]);


// Sa useEffect ng socket connection, DAGDAGAN ang mga listeners:
useEffect(() => {
  if (!socketRef.current) return;
  
  // ✅ NEW: Listen for teacher approval to enter exam
  socketRef.current.on('teacher-approve-exam-entry', (data) => {
    console.log('✅ Teacher approved exam entry:', data);
    
    if (data.examId === examId) {
      // Ngayon lang papasok sa exam
      setExamStarted(true);
      setPermissionsGranted(true);
      loadQuiz();
      
      alert('🎯 Teacher has started the exam! You may now enter.');
    }
  });
  
  // ✅ NEW: Listen for waiting room status updates
  socketRef.current.on('waiting-room-update', (data) => {
    console.log('🕒 Waiting room update:', data);
    
    if (data.examId === examId) {
      // Update UI based on waiting room status
      if (data.status === 'waiting') {
        // Show waiting count
        console.log(`👥 ${data.waitingCount} students in waiting room`);
      }
    }
  });
  
  // ✅ NEW: Listen for teacher rejection
  socketRef.current.on('teacher-reject-exam-entry', (data) => {
    console.log('❌ Teacher rejected exam entry:', data);
    
    if (data.examId === examId) {
      alert(`❌ ${data.reason || 'Teacher rejected your entry. Please check your camera and microphone.'}`);
      
      // Force back to waiting room
      setExamStarted(false);
      setPermissionsGranted(false);
    }
  });
  
}, [examId]);
=======
  const handleExamStart = useCallback(() => {
    // ✅ MICROPHONE IS NOW REQUIRED FROM THE START
    if (requiresMicrophone) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          setExamStarted(true);
          setPermissionsGranted(true);
          
          // ✅ CHECK IF ASYNC EXAM - USE LOCAL TIMER
          if (examType === 'asynchronous') {
            console.log('⏰ Async exam - Starting local timer');
            
            // For async exams, use teacher's timer immediately
            if (quiz?.timerSettings?.totalSeconds) {
              setTimeLeft(quiz.timerSettings.totalSeconds);
              setIsTimerRunning(true);
            } else if (quiz?.timeLimit) {
              setTimeLeft(quiz.timeLimit * 60);
              setIsTimerRunning(true);
            }
            
            // Save to localStorage
            saveTimerToLocalStorage(timeLeft, true);
          } else {
            // For live classes, check saved timer
            const savedTimer = loadTimerFromLocalStorage();
            if (savedTimer && savedTimer.examId === examId) {
              console.log('⏰ Resuming from saved timer:', savedTimer);
              setTimeLeft(savedTimer.timeLeft);
              setIsTimerRunning(savedTimer.isTimerRunning);
            }
          }
          
          loadQuiz();
        })
        .catch(error => {
          alert('🎤 Microphone access is REQUIRED. Please grant microphone permission to start the exam.');
          console.error('Microphone permission denied:', error);
        });
    } else {
      setExamStarted(true);
      setPermissionsGranted(true);
      
      // ✅ SIMILAR LOGIC FOR ASYNC EXAMS
      if (examType === 'asynchronous') {
        console.log('⏰ Async exam - Starting local timer (no mic)');
        
        if (quiz?.timerSettings?.totalSeconds) {
          setTimeLeft(quiz.timerSettings.totalSeconds);
          setIsTimerRunning(true);
        } else if (quiz?.timeLimit) {
          setTimeLeft(quiz.timeLimit * 60);
          setIsTimerRunning(true);
        }
        
        saveTimerToLocalStorage(timeLeft, true);
      } else {
        const savedTimer = loadTimerFromLocalStorage();
        if (savedTimer && savedTimer.examId === examId) {
          console.log('⏰ Resuming from saved timer:', savedTimer);
          setTimeLeft(savedTimer.timeLeft);
          setIsTimerRunning(savedTimer.isTimerRunning);
        }
      }
      
      loadQuiz();
    }
  }, [requiresMicrophone, loadQuiz, examId, examType, quiz]);
>>>>>>> backupRepo/main

  // ==================== SOCKET.IO SETUP ====================
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No token available for socket connection');
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      console.log('✅ Socket already connected, skipping reconnection');
      return;
    }

    console.log('🔑 Connecting student socket IMMEDIATELY...');

    const newSocket = io('http://localhost:3000', {
      auth: { token: token },
      query: { 
        examId: examId,
        userRole: 'student' 
      },
      transports: ['websocket', 'polling'],
      timeout: 30000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Student Socket connected successfully');
      
      newSocket.emit('join-exam-room', {
        roomId: `exam-${examId}`,
        userName: 'Student',
        userId: 'student-user',
        userRole: 'student'
      });
<<<<<<< HEAD
 // ✅ CHECK IF ASYNC EXAM - DON'T WAIT FOR TEACHER TIMER
  if (examType === 'asynchronous' && timeLeft > 0) {
    console.log('⏰ Async exam detected - auto-starting local timer');
    setIsTimerRunning(true);
    
    // Save timer state immediately
    saveTimerToLocalStorage(timeLeft, true);
  }

        // ✅ REQUEST TIME MULTIPLE TIMES FOR RELIABILITY
  const requestTime = () => {
    if (newSocket.connected) {
      console.log('🕒 Requesting current time from teacher...');
      newSocket.emit('student-time-request', {
        studentSocketId: newSocket.id,
        roomId: `exam-${examId}`
      });
    }
  };


// Add in student socket listeners
newSocket.on('force-timer-sync', (data) => {
  console.log('🔄 Received forced timer sync:', data);
  
  if (data.forceUpdate) {
    // Clear localStorage to avoid conflicts
    clearTimerFromLocalStorage();
    
    // Immediately update state
    setTimeLeft(data.timeLeft);
    setIsTimerRunning(data.isTimerRunning);
    
    // Save new time
    saveTimerToLocalStorage(data.timeLeft, data.isTimerRunning);
    
    console.log('✅ Timer force-updated:', {
      time: data.timeLeft,
      running: data.isTimerRunning,
      formatted: formatTime(data.timeLeft)
    });
  }
});
// In StudentQuizPage.jsx, add handler:
newSocket.on('clear-timer-cache', (data) => {
  if (data.examId === examId) {
    clearTimerFromLocalStorage();
    console.log('🧹 Timer cache cleared by teacher');
  }
});
=======
      
      // ✅ CHECK IF ASYNC EXAM - DON'T WAIT FOR TEACHER TIMER
      if (examType === 'asynchronous' && timeLeft > 0) {
        console.log('⏰ Async exam detected - auto-starting local timer');
        setIsTimerRunning(true);
        
        // Save timer state immediately
        saveTimerToLocalStorage(timeLeft, true);
      }

      // ✅ REQUEST TIME MULTIPLE TIMES FOR RELIABILITY
      const requestTime = () => {
        if (newSocket.connected) {
          console.log('🕒 Requesting current time from teacher...');
          newSocket.emit('student-time-request', {
            studentSocketId: newSocket.id,
            roomId: `exam-${examId}`
          });
        }
      };

      // ==================== COMPREHENSIVE DISCONNECTION HANDLER ====================
      // Add this handler after connection
      newSocket.on('force-exit-exam', (data) => {
        console.log('🛑 Force exit from exam initiated by teacher:', data);
        
        // Show appropriate message based on disconnection type
        let message = 'You have been disconnected from the exam session.';
        let alertType = 'warning';
        
        if (data.reason === 'time_up') {
          message = '⏰ Exam time has expired. You have been disconnected.';
          alertType = 'info';
        } else if (data.reason === 'excessive_violations') {
          message = '🚫 You have been disconnected due to excessive proctoring violations.';
          alertType = 'danger';
        } else if (data.reason === 'teacher_disconnected') {
          message = '👨‍🏫 Teacher has ended the exam session.';
          alertType = 'info';
        } else if (data.reason) {
          message = `Disconnected: ${data.reason}`;
        }
        
        // Show alert to student
        alert(`${message}\n\nYou will be redirected to the dashboard.`);
        
        // Clean up all media streams
        if (localStream) {
          console.log('🛑 Stopping local media stream');
          localStream.getTracks().forEach(track => {
            track.stop();
            console.log(`✅ Stopped ${track.kind} track`);
          });
          setLocalStream(null);
        }
        
        // Clean up WebRTC peer connections
        if (peerConnectionRef.current) {
          console.log('🛑 Closing peer connection');
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
          setPeerConnection(null);
        }
        
        // Stop proctoring intervals if any
        if (proctoringIntervalRef.current) {
          clearInterval(proctoringIntervalRef.current);
          proctoringIntervalRef.current = null;
        }
        
        // Clear timer from localStorage
        clearTimerFromLocalStorage();
        
        // Submit answers if data indicates to do so
        if (data.submitAnswers && Object.keys(answers).length > 0) {
          console.log('📤 Auto-submitting answers before disconnection');
          handleSubmitQuiz(true).catch(err => {
            console.error('Failed to auto-submit:', err);
          });
        }
        
        // Disconnect socket
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        
        // Navigate back to dashboard
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              examDisconnected: true,
              examId: examId,
              reason: data.reason || 'disconnected_by_teacher',
              message: message,
              alertType: alertType
            } 
          });
        }, 2000);
      });

      newSocket.on('force-timer-sync', (data) => {
        console.log('🔄 Received forced timer sync:', data);
        
        if (data.forceUpdate) {
          // Clear localStorage to avoid conflicts
          clearTimerFromLocalStorage();
          
          // Immediately update state
          setTimeLeft(data.timeLeft);
          setIsTimerRunning(data.isTimerRunning);
          
          // Save new time
          saveTimerToLocalStorage(data.timeLeft, data.isTimerRunning);
          
          console.log('✅ Timer force-updated:', {
            time: data.timeLeft,
            running: data.isTimerRunning,
            formatted: formatTime(data.timeLeft)
          });
        }
      });

      newSocket.on('clear-timer-cache', (data) => {
        if (data.examId === examId) {
          clearTimerFromLocalStorage();
          console.log('🧹 Timer cache cleared by teacher');
        }
      });

      newSocket.on('send-current-time', (data) => {
        console.log('🕒 Received time from teacher:', {
          timeLeft: data.timeLeft,
          isTimerRunning: data.isTimerRunning,
          examStarted: data.examStarted
        });
        
        // ✅ FIX: Check if teacher sent minutes instead of seconds
        let receivedTime = data.timeLeft;
        
        // If value is less than 100 and greater than 0, assume it's minutes
        if (receivedTime < 100 && receivedTime > 0) {
          console.log('🔄 Converting minutes to seconds:', receivedTime, 'minutes');
          receivedTime = receivedTime * 60; // Convert to seconds
        }
        
        // ✅ ALWAYS USE TEACHER'S TIME - OVERRIDE LOCALSTORAGE
        setTimeLeft(receivedTime);
        setIsTimerRunning(data.isTimerRunning);
        
        // Save teacher's time as source of truth
        saveTimerToLocalStorage(receivedTime, data.isTimerRunning);
        
        console.log('✅ Timer synced with teacher:', {
          received: data.timeLeft,
          converted: receivedTime,
          formatted: formatTime(receivedTime)
        });
        
        if (data.examStarted && !examStarted) {
          setExamStarted(true);
          setPermissionsGranted(true);
        }
      });

      newSocket.on('proctoring-violation', (data) => {
        console.log('⚠️ Student received proctoring violation:', data);
        
        setStudentAttempts(prev => {
          const newAttempts = prev.currentAttempts + 1;
          const attemptsLeft = Math.max(0, prev.maxAttempts - newAttempts);
          
          const updated = {
            ...prev,
            currentAttempts: newAttempts,
            attemptsLeft: attemptsLeft,
            history: [
              ...prev.history,
              {
                timestamp: new Date().toISOString(),
                violation: data.message || data.violationType,
                attemptsLeft: attemptsLeft
              }
            ].slice(-10)
          };
          
          if (attemptsLeft <= 3 && attemptsLeft > 0) {
            alert(`⚠️ Warning: Only ${attemptsLeft} attempt(s) left!`);
          }
          
          if (attemptsLeft <= 0) {
            alert('❌ You have been disconnected due to excessive violations.');
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          }
          
          return updated;
        });
        
        const newAlert = {
          id: Date.now(),
          message: data.message || 'Suspicious activity detected',
          timestamp: new Date().toLocaleTimeString(),
          type: data.type || 'warning',
          severity: data.severity || 'medium'
        };
        
        setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
      });
>>>>>>> backupRepo/main

      newSocket.on('student-violation', (data) => {
        console.log('⚠️ Received violation:', data);
        
        const detectionTypeMap = {
          'audio_detected': 'audio_detection',
          'speaking_detected': 'audio_detection', 
          'gesture_detected': 'suspicious_gesture',
          'tab_switch_detected': 'tab_switching',
        };
        
        const detectionType = detectionTypeMap[data.violationType] || data.violationType;
        
        setStudentAttempts(prev => {
          const newAttempts = prev.currentAttempts + 1;
          const attemptsLeft = Math.max(0, prev.maxAttempts - newAttempts);
          
          const updated = {
            ...prev,
            currentAttempts: newAttempts,
            attemptsLeft: attemptsLeft,
            history: [
              ...prev.history,
              {
                timestamp: new Date().toISOString(),
                violation: detectionType,
                attemptsLeft: attemptsLeft
              }
            ].slice(-10)
          };
          
          if (attemptsLeft <= 0) {
            alert('❌ You have been disconnected due to excessive violations.');
            navigate('/dashboard');
          }
          
          return updated;
        });
      });

      // ✅ REQUEST CURRENT TIME - SERVER WILL SEND PERSISTENT TIMER
<<<<<<< HEAD
  setTimeout(() => {
    if (newSocket.connected) {
      console.log('🕒 Requesting persistent timer from server...');
      newSocket.emit('student-time-request', {
        studentSocketId: newSocket.id,
        roomId: `exam-${examId}`,
        examId: examId
      });
    }
  }, 1000);
});

    newSocket.on('detection-settings-update', (data) => {
      console.log('🎯 Received detection settings from teacher:', data);
=======
      setTimeout(() => {
        if (newSocket.connected) {
          console.log('🕒 Requesting persistent timer from server...');
          newSocket.emit('student-time-request', {
            studentSocketId: newSocket.id,
            roomId: `exam-${examId}`,
            examId: examId
          });
        }
      }, 1000);
    });

    newSocket.on('detection-settings-update', (data) => {
      console.log(' Received detection settings from teacher:', data);
>>>>>>> backupRepo/main
      
      if (data.settings) {
        setTeacherDetectionSettings(prev => ({
          ...prev,
          ...data.settings
        }));
        
        if (data.settings.maxAttempts) {
          setStudentAttempts(prev => ({
            ...prev,
            maxAttempts: data.settings.maxAttempts,
            attemptsLeft: data.settings.maxAttempts - prev.currentAttempts
          }));
        }
      }
    });

    newSocket.on('exam-started', (data) => {
<<<<<<< HEAD
  console.log('✅ Exam started by teacher:', data);
  setExamStarted(true);
  setPermissionsGranted(true);
  if (requiresCamera) setCameraActive(true);
  if (requiresMicrophone) setMicrophoneActive(true);
  
  // ✅ AUTO-START STUDENT TIMER
  setIsTimerRunning(true);
  
  // Request current time from teacher
  setTimeout(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('student-time-request', {
        studentSocketId: socketRef.current.id,
        roomId: `exam-${examId}`
      });
      console.log('🕒 Requested timer from teacher after exam start');
    }
  }, 1000);
  
  loadQuiz();
});
=======
      console.log('✅ Exam started by teacher:', data);
      setExamStarted(true);
      setPermissionsGranted(true);
      if (requiresCamera) setCameraActive(true);
      if (requiresMicrophone) setMicrophoneActive(true);
      
      // ✅ AUTO-START STUDENT TIMER
      setIsTimerRunning(true);
      
      // Request current time from teacher
      setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('student-time-request', {
            studentSocketId: socketRef.current.id,
            roomId: `exam-${examId}`
          });
          console.log('🕒 Requested timer from teacher after exam start');
        }
      }, 1000);
      
      loadQuiz();
    });
>>>>>>> backupRepo/main

    newSocket.on('exam-ended', (data) => {
      console.log('🛑 Exam ended by teacher:', data);
      
      handleSubmitQuiz(true);
      
      alert('⏹️ Exam has been ended by the teacher. Your answers are being submitted.');

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    });

    newSocket.on('teacher-disconnect', (data) => {
      console.log('🔌 Disconnected by teacher:', data);
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      alert(`❌ ${data.reason || 'You have been disconnected by the teacher.'}`);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    });

<<<<<<< HEAD
newSocket.on('exam-time-update', (data) => {
  const now = Date.now();
  
  // ✅ DEBOUNCE: Prevent multiple updates within 1 second
  if (now - lastTimerUpdateRef.current < 1000) {
    console.log('⏰ Debounced duplicate timer update');
    return;
  }
  
  lastTimerUpdateRef.current = now;
  
  if (examType === 'asynchronous') {
    console.log('🛑 Ignoring teacher timer for async exam - using local timer');
    return;
  }
  
  console.log('🕒 Processing timer update from teacher:', {
    timeLeft: data.timeLeft,
    isTimerRunning: data.isTimerRunning,
    timestamp: new Date().toLocaleTimeString()
  });
  
  // ✅ FIX: Convert minutes to seconds if needed
  let receivedTime = data.timeLeft;
  
  if (receivedTime < 100 && receivedTime > 0) {
    console.log('🔄 Converting minutes to seconds:', receivedTime);
    receivedTime = receivedTime * 60;
  }
  
  // ✅ SINGLE STATE UPDATE
  setTimeLeft(receivedTime);
  setIsTimerRunning(data.isTimerRunning);
  
  // ✅ Save ONCE (throttled by the function)
  saveTimerToLocalStorage(receivedTime, data.isTimerRunning);
  
  console.log('✅ Timer synced:', {
    time: formatTime(receivedTime),
    running: data.isTimerRunning
  });
});
=======
    newSocket.on('exam-time-update', (data) => {
      if (examType === 'asynchronous') {
        console.log('🛑 Ignoring teacher timer update for async exam');
        return;
      }
      console.log('🕒 Received timer update from teacher:', {
        timeLeft: data.timeLeft,
        isTimerRunning: data.isTimerRunning,
        teacher: data.teacherName,
        timestamp: data.timestamp
      });
      
      // ✅ FIX: Convert if teacher sent minutes instead of seconds
      let receivedTime = data.timeLeft;
      
      // Check if teacher sent minutes (if value is less than 100, assume minutes)
      if (receivedTime < 100 && receivedTime > 0) {
        console.log('🔄 Converting minutes to seconds:', receivedTime, 'minutes');
        receivedTime = receivedTime * 60; // Convert minutes to seconds
      }
      
      // Save to localStorage with proper conversion
      saveTimerToLocalStorage(receivedTime, data.isTimerRunning);
      
      // Update state
      setTimeLeft(receivedTime);
      setIsTimerRunning(data.isTimerRunning);
      
      console.log('✅ Timer updated:', {
        received: data.timeLeft,
        converted: receivedTime,
        formatted: formatTime(receivedTime)
      });
    });
>>>>>>> backupRepo/main

    newSocket.on('camera-request', handleCameraRequest);
    newSocket.on('webrtc-answer', handleWebRTCAnswer);
    newSocket.on('ice-candidate', handleICECandidate);
<<<<<<< HEAD
    // In socket event listeners, add:
// KEEP THIS - eto yung sa backend alerts
// Palitan ang existing na handler na ito:
newSocket.on('proctoring-alert', (alertData) => {
  console.log('🚨 Student received proctoring alert:', alertData);
  
  // ✅ DITO MAG-FORWARD PAPUNTA SA TEACHER
  const forwardData = {
    examId: examId,
    studentSocketId: socketRef.current.id,
    message: alertData.message || 'Suspicious activity detected',
    type: alertData.type || 'warning',
    severity: alertData.severity || 'medium',
    timestamp: new Date().toISOString(),
    detectionType: alertData.detectionType || 'unknown',
    confidence: alertData.confidence || 0.7,
    attemptsInfo: {
      currentAttempts: studentAttempts.currentAttempts + 1,
      maxAttempts: studentAttempts.maxAttempts,
      attemptsLeft: Math.max(0, studentAttempts.maxAttempts - (studentAttempts.currentAttempts + 1))
    }
  };
  
  // I-forward sa teacher
  if (socketRef.current && examId) {
    socketRef.current.emit('forward-proctoring-alert', forwardData);
    console.log('📤 Student forwarding alert to teacher:', forwardData);
  }
  
  // Update local attempts
  setStudentAttempts(prev => {
    const newAttempts = prev.currentAttempts + 1;
    return {
      ...prev,
      currentAttempts: newAttempts,
      attemptsLeft: Math.max(0, prev.maxAttempts - newAttempts)
    };
  });
  
  // Add to alerts display
  const newAlert = {
    id: Date.now(),
    message: alertData.message || 'Suspicious activity detected',
    timestamp: new Date().toLocaleTimeString(),
    type: alertData.type || 'warning',
    severity: alertData.severity || 'medium',
    detectionType: alertData.detectionType
  };
  
  setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);

});
  newSocket.on('chat-message', handleChatMessage);
  newSocket.on('attempts-update', (data) => {
  console.log('📊 Received attempts update:', data);
  
  setStudentAttempts({
    currentAttempts: data.attempts.current_attempts,
    maxAttempts: data.attempts.max_attempts,
    attemptsLeft: data.attempts.attempts_left,
    history: data.attempts.violation_history || []
  });
  
  // Show warning if attempts low
  if (data.attempts.attempts_left <= 3 && data.attempts.attempts_left > 0) {
    const newAlert = {
      id: Date.now(),
      message: `⚠️ Warning: ${data.attempts.attempts_left} attempt(s) remaining!`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'danger',
      severity: 'high'
    };
    
    setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
  }
  
  // Auto disconnect if attempts exhausted
  if (data.attempts.attempts_left <= 0) {
    alert('❌ You have been disconnected due to excessive violations.');
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  }
});


// In socket listeners:
newSocket.on('live-class-ended', (data) => {
  console.log('🛑 Live class ended by teacher:', data);
  
  if (data.examId === examId) {
    // ✅ DISABLE JOIN BUTTON IMMEDIATELY
    setQuiz(prev => prev ? {
      ...prev,
      isActive: false,
      endedAt: data.endedAt || new Date().toISOString()
    } : prev);
    
    alert('⏹️ Live class has ended. You can no longer join this session.');
    
    // ✅ IF CURRENTLY IN SESSION, REDIRECT OUT
    if (examStarted) {
      setTimeout(() => {
        navigate('/dashboard', {
          state: {
            message: 'Live class has ended'
          }
        });
      }, 3000);
    }
  }
});

newSocket.on('force-exit-exam', (data) => {
  console.log('🔌 Force exit from exam:', data);
  
  alert(`🛑 ${data.reason || 'You have been disconnected from the exam.'}`);
  
  setTimeout(() => {
    navigate('/dashboard');
  }, 2000);
});

// StudentQuizPage.jsx - UPDATE sa socket event listener:

newSocket.on('send-current-time', (data) => {
  console.log('🕒 Received current time from teacher:', data);
  
  // ✅ IGNORE TEACHER TIMER IF ASYNC EXAM
  if (examType === 'asynchronous') {
    console.log('🛑 Ignoring teacher timer for async exam - using local timer');
    return; // STOP HERE! Don't update!
  }
  
  // Only accept for live-class exams
  let receivedTime = data.timeLeft;
  
  // Convert minutes to seconds if needed
  if (receivedTime < 100 && receivedTime > 0) {
    console.log('🔄 Converting minutes to seconds:', receivedTime);
    receivedTime = receivedTime * 60;
  }
  
  setTimeLeft(receivedTime);
  setIsTimerRunning(data.isTimerRunning);
  
  // Save to localStorage
  saveTimerToLocalStorage(receivedTime, data.isTimerRunning);
  
  console.log('✅ Student timer synced with teacher:', {
    time: formatTime(receivedTime),
    running: data.isTimerRunning
  });
});

newSocket.on('exam-time-update', (data) => {
  console.log('🕒 Student received timer update from teacher:', data);
  // ✅ IGNORE IF ASYNC EXAM
  if (examType === 'asynchronous') {
    console.log('🛑 Ignoring teacher timer update for async exam');
    return;
  }

  let receivedTime = data.timeLeft;
  
  // Convert minutes to seconds if needed
  if (receivedTime < 100 && receivedTime > 0) {
    console.log('🔄 Converting minutes to seconds:', receivedTime);
    receivedTime = receivedTime * 60;
  }
  
  setTimeLeft(receivedTime);
  setIsTimerRunning(data.isTimerRunning);
  
  // Save to localStorage
  saveTimerToLocalStorage(receivedTime, data.isTimerRunning);
  
  console.log('✅ Timer updated:', {
    time: formatTime(receivedTime),
    running: data.isTimerRunning
  });
});
=======
    
    newSocket.on('proctoring-alert', (alertData) => {
      console.log('🚨 Student received proctoring alert:', alertData);
      
      // ✅ UPDATE ATTEMPTS FROM SERVER
      if (alertData.attemptsInfo) {
        setStudentAttempts({
          currentAttempts: alertData.attemptsInfo.currentAttempts,
          maxAttempts: alertData.attemptsInfo.maxAttempts,
          attemptsLeft: alertData.attemptsInfo.attemptsLeft,
          history: alertData.attemptsInfo.violation_history || []
        });
        
        // Show warning if attempts low
        if (alertData.attemptsInfo.attemptsLeft <= 3 && alertData.attemptsInfo.attemptsLeft > 0) {
          const newAlert = {
            id: Date.now(),
            message: `⚠️ Warning: ${alertData.attemptsInfo.attemptsLeft} attempt(s) remaining!`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'danger',
            severity: 'high'
          };
          
          setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
        }
      }
      
      // Add the alert to display
      const newAlert = {
        id: Date.now(),
        message: alertData.message || 'Suspicious activity detected',
        timestamp: new Date().toLocaleTimeString(),
        type: alertData.type || 'warning',
        severity: alertData.severity || 'medium',
        detectionType: alertData.detectionType
      };
      
      setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
    });
    
    newSocket.on('chat-message', handleChatMessage);
    
    newSocket.on('attempts-update', (data) => {
      console.log('📊 Received attempts update:', data);
      
      setStudentAttempts({
        currentAttempts: data.attempts.current_attempts,
        maxAttempts: data.attempts.max_attempts,
        attemptsLeft: data.attempts.attempts_left,
        history: data.attempts.violation_history || []
      });
      
      // Show warning if attempts low
      if (data.attempts.attempts_left <= 3 && data.attempts.attempts_left > 0) {
        const newAlert = {
          id: Date.now(),
          message: `⚠️ Warning: ${data.attempts.attempts_left} attempt(s) remaining!`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'danger',
          severity: 'high'
        };
        
        setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
      }
      
      // Auto disconnect if attempts exhausted
      if (data.attempts.attempts_left <= 0) {
        alert('❌ You have been disconnected due to excessive violations.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    });

    newSocket.on('live-class-ended', (data) => {
      console.log('🛑 Live class ended by teacher:', data);
      
      if (data.examId === examId) {
        // ✅ DISABLE JOIN BUTTON IMMEDIATELY
        setQuiz(prev => prev ? {
          ...prev,
          isActive: false,
          endedAt: data.endedAt || new Date().toISOString()
        } : prev);
        
        alert('⏹️ Live class has ended. You can no longer join this session.');
        
        // ✅ IF CURRENTLY IN SESSION, REDIRECT OUT
        if (examStarted) {
          setTimeout(() => {
            navigate('/dashboard', {
              state: {
                message: 'Live class has ended'
              }
            });
          }, 3000);
        }
      }
    });
>>>>>>> backupRepo/main

    socketRef.current = newSocket;

    return () => {
      console.log('🛑 Cleaning up student socket');
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [examId]);

<<<<<<< HEAD


// ✅ RECOVER TIMER ON RECONNECT
useEffect(() => {
  if (socketRef.current && socketRef.current.connected && examStarted) {
    // Re-request timer every 30 seconds to stay in sync
    const interval = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('student-time-request', {
          studentSocketId: socketRef.current.id,
          roomId: `exam-${examId}`,
          examId: examId
        });
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }
}, [examStarted, examId]);


=======
  // ==================== STUDENT TIMER COUNTDOWN WITH PERSISTENCE ====================
  useEffect(() => {
    if (timeLeft === null || !isTimerRunning) {
      console.log('⏰ Student timer stopped:', { 
        timeLeft, 
        isTimerRunning,
        examStarted,
        examType
      });
      return;
    }

    console.log('⏰ Student timer STARTED:', {
      initialTime: timeLeft,
      formatted: formatTime(timeLeft),
      examStarted,
      permissionsGranted,
      examType: examType
    });

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log('⏰ Student time expired! Auto-submitting...');
          clearTimerFromLocalStorage();
          handleSubmitQuiz(true);
          return 0;
        }
        
        const newTime = prev - 1;
        
        // ✅ AUTO-SAVE TO LOCALSTORAGE EVERY 10 SECONDS
        if (newTime % 10 === 0) {
          saveTimerToLocalStorage(newTime, isTimerRunning);
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      console.log('⏰ Student timer cleaned up');
    };
  }, [timeLeft, isTimerRunning, handleSubmitQuiz, examStarted, examType]);

  // ✅ AUTO-SAVE ON PAUSE/RESUME
  useEffect(() => {
    if (timeLeft !== null) {
      saveTimerToLocalStorage(timeLeft, isTimerRunning);
      console.log('💾 Timer state saved:', {
        time: timeLeft,
        running: isTimerRunning
      });
    }
  }, [isTimerRunning, timeLeft]);

  // ✅ SAVE ON PAGE UNLOAD (WHEN STUDENT LEAVES)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (timeLeft !== null) {
        saveTimerToLocalStorage(timeLeft, isTimerRunning);
        console.log('💾 Timer saved before page unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timeLeft, isTimerRunning]);

  // ✅ RECOVER TIMER ON RECONNECT
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && examStarted) {
      // Re-request timer every 30 seconds to stay in sync
      const interval = setInterval(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('student-time-request', {
            studentSocketId: socketRef.current.id,
            roomId: `exam-${examId}`,
            examId: examId
          });
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [examStarted, examId]);

  // ==================== AUTO-START TIMER WHEN RECEIVED ====================
  useEffect(() => {
    // Auto-start timer when we receive time from teacher
    if (timeLeft !== null && timeLeft > 0 && examStarted) {
      // Only start if we haven't already
      if (!isTimerRunning) {
        console.log(' Auto-starting student timer:', formatTime(timeLeft));
        setIsTimerRunning(true);
      }
    }
  }, [timeLeft, examStarted, isTimerRunning]);
>>>>>>> backupRepo/main

  // ==================== WEBRTC HANDLERS ====================
  const handleCameraRequest = async (data, isRetry = false) => {
    console.log('📹 Camera request from teacher:', data);
    setCameraRequested(true);
    setTeacherSocketId(data.from || data.teacherSocketId);
    
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      console.log('🎥 Attempting to access camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 },
          facingMode: 'user'
        }, 
        audio: false 
      });
      
      console.log('✅ Camera accessed successfully');
      
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

<<<<<<< HEAD
      if (capabilities.exposureCompensation) {
        await videoTrack.applyConstraints({
          advanced: [{ exposureCompensation: -1.0 }]
        });
      }
=======
     
>>>>>>> backupRepo/main
      
      setLocalStream(stream);
      setIsSharingCamera(true);
      setCameraActive(true);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        console.log('➕ Adding track to peer connection:', track.kind);
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log('🧊 Sending ICE candidate to teacher');
          socketRef.current.emit('ice-candidate', {
            target: data.from || data.teacherSocketId,
            candidate: event.candidate
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('🔗 Student WebRTC state:', pc.connectionState);
      };

      console.log('🤝 Creating WebRTC offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('✅ Created local offer');

      if (socketRef.current) {
        socketRef.current.emit('webrtc-offer', {
          target: data.from || data.teacherSocketId,
          offer: offer
        });
        console.log('✅ Sent WebRTC offer to teacher');
      }

      socketRef.current.emit('camera-response', {
        teacherSocketId: data.from || data.teacherSocketId,
        enabled: true,
        studentId: 'student-user'
      });

      setPeerConnection(pc);

    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      setIsSharingCamera(false);
      setCameraActive(false);
      
      if (socketRef.current) {
        socketRef.current.emit('camera-response', {
          teacherSocketId: data.from || data.teacherSocketId,
          enabled: false,
          error: error.message
        });
      }
      
      alert('❌ Failed to access camera. Please check permissions.');
    }
  };

  const handleWebRTCAnswer = async (data) => {
    const pc = peerConnectionRef.current;
    
    if (!pc) {
      console.log('❌ No peer connection to set remote description');
      return;
    }

    try {
      console.log('🔍 Before setting answer:', {
        signalingState: pc.signalingState,
        hasLocalDescription: !!pc.localDescription
      });

      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      console.log('✅ Student set remote description from teacher answer');

      console.log('🔍 After setting answer:', {
        signalingState: pc.signalingState,
        hasRemoteDescription: !!pc.remoteDescription
      });

    } catch (error) {
      console.error('❌ Student error setting remote description:', error);
      
      if (error.toString().includes('m-lines') || error.toString().includes('InvalidAccessError')) {
        console.log('🔄 SDP mismatch detected, restarting WebRTC...');
        handleCameraRequest({ from: teacherSocketId });
      }
    }
  };

  const handleICECandidate = async (data) => {
    const pc = peerConnectionRef.current;
    if (pc && data.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('✅ Student added ICE candidate from teacher');
      } catch (error) {
        console.error('❌ Student error adding ICE candidate:', error);
      }
    }
  };

  // ==================== PROCTORING ALERTS HANDLER ====================
<<<<<<< HEAD
// In StudentQuizPage.jsx, update the handleProctoringAlert function:

const handleProctoringAlert = useCallback((alertData) => {
  console.log('🚨 Student detected proctoring alert:', alertData);
  
  // ✅ ENHANCE THE ALERT WITH STUDENT INFO
  const enhancedAlert = {
    ...alertData,
    examId: examId,
    studentSocketId: socketRef.current?.id,
    studentId: 'student-user', // Replace with actual student ID
    timestamp: new Date().toISOString(),
    source: 'student_browser'
  };
  
  // ✅ SEND TO SERVER WITH RETRY LOGIC
  const sendAlert = (retryCount = 0) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('proctoring-alert', enhancedAlert);
      console.log('📤 Proctoring alert sent to server:', enhancedAlert);
    } else if (retryCount < 3) {
      console.log(`🔄 Socket not connected, retrying in 1s... (${retryCount + 1}/3)`);
      setTimeout(() => sendAlert(retryCount + 1), 1000);
    } else {
      console.error('❌ Failed to send alert after 3 retries');
      // Store locally for later sync
      storeAlertLocally(enhancedAlert);
    }
  };
  
  sendAlert();
  
  // Also update local state
  const newAlert = {
    id: Date.now(),
    message: alertData.message,
    timestamp: new Date().toLocaleTimeString(),
    type: alertData.type || 'warning',
    severity: alertData.severity || 'medium',
    detectionType: alertData.detectionType
  };
  
  setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
  
}, [examId, navigate, teacherDetectionSettings]);

// ✅ FUNCTION TO STORE ALERTS LOCALLY IF SERVER UNREACHABLE
const storeAlertLocally = (alertData) => {
  const pendingAlerts = JSON.parse(localStorage.getItem('pending-proctoring-alerts') || '[]');
  pendingAlerts.push({
    ...alertData,
    storedAt: new Date().toISOString(),
    examId: examId
  });
  localStorage.setItem('pending-proctoring-alerts', JSON.stringify(pendingAlerts));
  
  // Try to sync later
  setTimeout(() => syncPendingAlerts(), 5000);
};

// ✅ SYNC PENDING ALERTS
const syncPendingAlerts = () => {
  if (!socketRef.current || !socketRef.current.connected) return;
  
  const pendingAlerts = JSON.parse(localStorage.getItem('pending-proctoring-alerts') || '[]');
  const examAlerts = pendingAlerts.filter(alert => alert.examId === examId);
  
  if (examAlerts.length > 0) {
    examAlerts.forEach(alert => {
      socketRef.current.emit('proctoring-alert', alert);
      console.log('📤 Syncing pending alert:', alert);
    });
    
    // Remove sent alerts
    const remainingAlerts = pendingAlerts.filter(alert => alert.examId !== examId);
    localStorage.setItem('pending-proctoring-alerts', JSON.stringify(remainingAlerts));
  }
};
=======
  const handleProctoringAlert = useCallback((alertData) => {
    console.log('🚨 Student received proctoring alert:', alertData);
    
    const isTeacherUpdateMessage = alertData.message && 
        (alertData.message.includes('Teacher updated:') ||
         alertData.message.includes('detection settings'));
    
    if (isTeacherUpdateMessage) {
      console.log('📝 Teacher update message - NOT counting as attempt');
      const newAlert = {
        id: Date.now(),
        message: alertData.message,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        severity: 'low'
      };
      
      setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
      return;
    }
    
    const isLikelyFalsePositive = alertData.message && (
      alertData.message.includes('gaze_deviation') && 
      !alertData.message.includes('sustained')
    );
    
    if (isLikelyFalsePositive) {
      console.log('🔍 Likely false positive - ignoring:', alertData.message);
      return;
    }
    
    const isAlertTypeEnabled = (detectionType) => {
      const settingMap = {
        'audio_detection': teacherDetectionSettings.audioDetection,
        'suspicious_gesture': teacherDetectionSettings.handGestureDetection,
        'tab_switching': teacherDetectionSettings.tabSwitchDetection,
        'screenshot_attempt': teacherDetectionSettings.screenshotDetection,
        'screenshot_tool_detected': teacherDetectionSettings.screenshotDetection,
        'gaze_deviation': teacherDetectionSettings.gazeDetection,
        'phone_usage': teacherDetectionSettings.phoneDetection,
        'multiple_people': teacherDetectionSettings.multiplePeopleDetection,
        'mouth_movement': teacherDetectionSettings.mouthDetection
      };
      
      return settingMap[detectionType] !== false;
    };
    
    const detectionType = alertData.detectionType;
    if (detectionType && !isAlertTypeEnabled(detectionType)) {
      console.log(`🛑 Alert type ${detectionType} disabled by teacher - ignoring`);
      return;
    }
    
    const shouldCountAsAttempt = detectionType && [
      'multiple_people', 'audio_detection',
      'tab_switching', 'suspicious_gesture', 'speaking_detected',
      'no_face_detected',
      'low_attention_score'
    ].includes(detectionType);
    
    if (shouldCountAsAttempt) {
      setStudentAttempts(prev => {
        const newAttempts = prev.currentAttempts + 1;
        const attemptsLeft = Math.max(0, prev.maxAttempts - newAttempts);
        
        const updated = {
          ...prev,
          currentAttempts: newAttempts,
          attemptsLeft: attemptsLeft,
          history: [
            ...prev.history,
            {
              timestamp: new Date().toISOString(),
              violation: detectionType,
              message: alertData.message,
              attemptsLeft: attemptsLeft
            }
          ].slice(-10)
        };
        
        if (attemptsLeft <= 3 && attemptsLeft > 0) {
          alert(`⚠️ Warning: Only ${attemptsLeft} attempt(s) left!`);
        }
        
        if (attemptsLeft <= 0) {
          alert('❌ You have been disconnected due to excessive violations.');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
        
        return updated;
      });
    }
    
    const newAlert = {
      id: Date.now(),
      message: alertData.message || 'Suspicious activity detected',
      timestamp: new Date().toLocaleTimeString(),
      type: alertData.type || 'warning',
      severity: alertData.severity || 'medium',
      detectionType: detectionType
    };
    
    setProctoringAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
  }, [navigate, teacherDetectionSettings]);

>>>>>>> backupRepo/main
  // ==================== MICROPHONE STATE HANDLER ====================
  const handleMicrophoneStateChange = useCallback((isActive) => {
    setMicrophoneActive(isActive);
    if (!isActive && requiresMicrophone) {
      setProctoringAlerts(prev => [{
        id: Date.now(),
        message: '🎤 Microphone muted - Audio monitoring paused',
        timestamp: new Date().toLocaleTimeString(),
        type: 'warning'
      }, ...prev.slice(0, 4)]);
    }
  }, [requiresMicrophone]);

  // ==================== CAMERA STATE HANDLER ====================
  const handleCameraStateChange = useCallback((isActive) => {
    setCameraActive(isActive);
    if (!isActive && requiresCamera) {
      setProctoringAlerts(prev => [{
        id: Date.now(),
        message: '⚠️ Camera disconnected - Monitoring paused',
        timestamp: new Date().toLocaleTimeString(),
        type: 'warning'
      }, ...prev.slice(0, 4)]);
    }
  }, [requiresCamera]);

  // ==================== CHAT FUNCTIONS ====================
  const handleChatMessage = useCallback((data) => {
    console.log('💬 Student received chat message:', data);
    
    if (!data.message) {
      console.error('❌ Invalid chat message format:', data);
      return;
    }

    const newMessage = {
      id: data.message.id || Date.now().toString(),
      text: data.message.text,
      sender: data.message.sender,
      senderName: data.message.senderName || 'Teacher',
      timestamp: new Date(data.message.timestamp || Date.now()),
      type: data.message.type || 'teacher'
    };
    
    console.log('💾 Adding message to student state:', newMessage);
    
    setMessages(prev => {
      const updatedMessages = [...prev, newMessage];
      console.log('📝 Student messages count:', updatedMessages.length);
      return updatedMessages;
    });
    
    if (!showChat) {
      setUnreadCount(prev => prev + 1);
    }
  }, [showChat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    const messageData = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'student',
      senderName: 'Student',
      timestamp: new Date(),
      type: 'student'
    };

    socketRef.current.emit('send-chat-message', {
      roomId: `exam-${examId}`,
      message: messageData
    });

    setNewMessage('');

    console.log('📤 Student sent message:', messageData);
  };

  const toggleChat = () => {
    setShowChat(prev => {
      if (!prev) {
        setUnreadCount(0);
      }
      return !prev;
    });
  };

<<<<<<< HEAD
// StudentQuizPage.jsx - ADD useEffect to prevent disabling monitoring
useEffect(() => {
  if (examType === 'asynchronous' && examStarted) {
    // Prevent disabling camera during async exams
    const handleCameraDisableAttempt = () => {
      if (requiresCamera && !cameraActive) {
        alert('❌ Camera cannot be disabled during async exams!');
        // Force re-enable camera
        // You might need to add logic to reinitialize camera here
      }
    };

    // Prevent disabling microphone during async exams
    const handleMicDisableAttempt = () => {
      if (requiresMicrophone && !microphoneActive) {
        alert('❌ Microphone cannot be disabled during async exams!');
        // Force re-enable microphone
        // You might need to add logic to reinitialize microphone here
      }
    };

    // Check periodically
    const checkInterval = setInterval(() => {
      handleCameraDisableAttempt();
      handleMicDisableAttempt();
    }, 5000);

    return () => clearInterval(checkInterval);
  }
}, [examType, examStarted, requiresCamera, cameraActive, requiresMicrophone, microphoneActive]);
=======
  // ==================== UTILITY FUNCTIONS ====================
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };
>>>>>>> backupRepo/main

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    if (examId) {
      loadQuiz();
    }
  }, [examId, loadQuiz]);

  // ==================== RENDER FUNCTIONS ====================
  const progressPercentage = (answeredCount / (quiz?.questions?.length || 1)) * 100;

  // Show permission check first
  if (!examStarted) {
    return (
      <WaitingRoomComponent 
        requiresCamera={requiresCamera}
        requiresMicrophone={requiresMicrophone}
        onExamStarted={handleExamStart}
        onCancel={handleCancelExam}
        examTitle={examTitle}
        className={className}
        teacherDetectionSettings={teacherDetectionSettings}
<<<<<<< HEAD
        examType={examType} 
=======
>>>>>>> backupRepo/main
      />
    );
  }

  // Add this check after permissions are granted but before exam starts
  if (permissionsGranted && !examStarted) {
    return (
      <div className="ready-waiting-room">
        <div className="ready-waiting-content">
          <div className="waiting-header">
            <h2>✅ Ready for Exam</h2>
            <p>All systems are ready. Waiting for teacher to start the exam...</p>
          </div>
          
          <div className="system-status">
            <div className="status-item">
              <span className="status-icon">📹</span>
              <span className="status-text">Camera: {cameraActive ? 'Ready' : 'Checking...'}</span>
            </div>
            <div className="status-item">
              <span className="status-icon">🎤</span>
              <span className="status-text">Microphone: {microphoneActive ? 'Ready' : 'Checking...'}</span>
            </div>
            <div className="status-item">
              <span className="status-icon">🔍</span>
              <span className="status-text">Proctoring: Active</span>
            </div>
          </div>

          <div className="waiting-rules">
            <h4>Important Rules:</h4>
            <ul>
              <li>❌ Do not switch tabs or open new windows</li>
              <li>❌ Do not use mobile phones or other devices</li>
              <li>❌ Do not talk to other people</li>
              <li>✅ Keep your face visible to the camera</li>
              <li>✅ Stay in the frame throughout the exam</li>
            </ul>
          </div>

          <div className="loading-waiting">
            <div className="pulse-animation"></div>
            <p>Standing by for exam start signal...</p>
          </div>

          <button className="cancel-btn" onClick={handleCancelExam}>
            ← Leave Exam
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="loading-spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="quiz-error">
        <h2>❌ Error Loading Quiz</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={loadQuiz} className="retry-btn">
            🔄 Try Again
          </button>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Quiz not found state
  if (!quiz) {
    return (
      <div className="quiz-error">
        <h2>❌ Quiz Not Found</h2>
        <p>The quiz you're trying to access is not available or has been removed.</p>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className={`student-quiz-container ${requiresCamera || requiresMicrophone ? 'exam-mode' : 'quiz-mode'}`}>
      
      <HeaderAlerts alerts={proctoringAlerts} />

      <div className="quiz-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <div className="quiz-info">
            <h1 className="class-info">Class: {className}</h1>
            <div className="quiz-meta">
              {/* Quiz meta information */}
            </div>
          </div>
        </div>
<<<<<<< HEAD
       <div className="header-right">
  {/* ✅ ATTEMPTS DISPLAY */}
  <div className="exam-type-indicator">
  {examType === 'asynchronous' ? '⏱️ Async Exam' : '🎥 Live Class'}
</div>
  <div className="attempts-display-student">
    <span className="attempts-text">
      Attempts: {studentAttempts.attemptsLeft}/{studentAttempts.maxAttempts}
    </span>
    <span className="attempts-used">
      Used: {studentAttempts.currentAttempts.toFixed(1)}
    </span>
    {studentAttempts.attemptsLeft <= 3 && studentAttempts.attemptsLeft > 0 && (
      <span className="attempts-warning">
        ⚠️ {studentAttempts.attemptsLeft} attempt(s) left!
      </span>
    )}
    {studentAttempts.attemptsLeft === 0 && (
      <span className="attempts-danger">
        🚫 No attempts left!
      </span>
    )}
  </div>

           {/* ✅ UPDATED TIMER DISPLAY - SHOW SYNC STATUS */}
  {/* ✅ IMPROVED TIMER DISPLAY - SHOW REAL-TIME STATUS */}
<div className="timer-section-student">
  <div className={`timer-display-student ${isTimerRunning ? 'running' : 'paused'}`}>
    {timeLeft !== null ? (
      <>
        <span className="timer-icon">
          {isTimerRunning ? '⏱️' : '⏸️'}
        </span>
        <span className="timer-text">
          {formatTime(timeLeft)}
        </span>
        <span className="timer-status">
          {isTimerRunning ? 'Running' : 'Paused'}
        </span>
        
        {/* Show time warnings */}
        {timeLeft < 300 && timeLeft > 60 && (
          <span className="time-warning-badge">⚠️ 5 min</span>
        )}
        {timeLeft <= 60 && timeLeft > 0 && (
          <span className="time-critical-badge">🚨 1 min</span>
        )}
      </>
    ) : (
      <span className="timer-loading">
        <div className="loading-spinner-tiny"></div>
        Syncing timer...
      </span>
    )}
  </div>
</div>
=======
        <div className="header-right">
          <div className="exam-type-indicator">
            {examType === 'asynchronous' ? ' Async Exam' : '🎥 Live Class'}
          </div>
          <div className="attempts-display-student">
            <span className="attempts-text">
              Attempts: {studentAttempts.attemptsLeft}/{studentAttempts.maxAttempts}
            </span>
            <span className="attempts-used">
              Used: {studentAttempts.currentAttempts.toFixed(1)}
            </span>
            {studentAttempts.attemptsLeft <= 3 && studentAttempts.attemptsLeft > 0 && (
              <span className="attempts-warning">
                ⚠️ {studentAttempts.attemptsLeft} attempt(s) left!
              </span>
            )}
            {studentAttempts.attemptsLeft === 0 && (
              <span className="attempts-danger">
                🚫 No attempts left!
              </span>
            )}
          </div>

          {/* ✅ UPDATED TIMER DISPLAY - SHOW SYNC STATUS */}
          <div className="timer-section-student">
            <div className={`timer-display-student ${isTimerRunning ? 'running' : 'paused'}`}>
              {timeLeft !== null ? (
                <>
                  <span className="timer-icon">
                    {isTimerRunning ? '' : '⏸️'}
                  </span>
                  <span className="timer-text">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="timer-status">
                    {isTimerRunning ? 'Running' : 'Paused'}
                  </span>
                  
                  {/* Show time warnings */}
                  {timeLeft < 300 && timeLeft > 60 && (
                    <span className="time-warning-badge">⚠️ 5 min</span>
                  )}
                  {timeLeft <= 60 && timeLeft > 0 && (
                    <span className="time-critical-badge">🚨 1 min</span>
                  )}
                </>
              ) : (
                <span className="timer-loading">
                  <div className="loading-spinner-tiny"></div>
                  Syncing timer...
                </span>
              )}
            </div>
          </div>
>>>>>>> backupRepo/main

          {(requiresCamera || requiresMicrophone) && (
            <div className="monitoring-status-header">
              {requiresCamera && (
                <span className={`camera-indicator ${cameraActive ? 'active' : 'inactive'}`}>
                  {cameraActive ? '' : ''}
                </span>
              )}
              {requiresMicrophone && (
                <span className={`microphone-indicator ${microphoneActive ? 'active' : 'inactive'}`}>
                  {microphoneActive ? '' : ''}
                </span>
              )}
              {isSharingCamera && (
                <span className="sharing-indicator">
                  
                </span>
              )}
              {proctoringAlerts.length > 0 && (
                <button 
                  className={`alert-count-btn ${proctoringAlerts.length > 0 ? 'has-alerts' : ''}`}
                  onClick={() => setShowAlertsPanel(!showAlertsPanel)}
                >
                  🚨 Alerts: {proctoringAlerts.length}
                </button>
              )}
            </div>
          )}
          
          {/* Chat Toggle Button */}
          <button 
            className={`chat-toggle-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={toggleChat}
          >
            💬 Chat
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Camera Sharing Status Indicator */}
      {cameraRequested && (
        <div className="camera-sharing-status">
          <div className={`sharing-indicator ${isSharingCamera ? 'active' : 'denied'}`}>
            <span className="sharing-icon">
              {isSharingCamera ? '📹' : '📹❌'}
            </span>
            <span className="sharing-text">
              {isSharingCamera ? 'Camera shared with teacher' : 'Camera access denied'}
            </span>
          </div>
        </div>
      )}

      {/* Proctoring Alerts Panel */}
      <ProctoringAlertsPanel 
        alerts={proctoringAlerts}
        isOpen={showAlertsPanel}
        onToggle={() => setShowAlertsPanel(!showAlertsPanel)}
      />

<<<<<<< HEAD
     {/* ✅ TIMER DISPLAY WITH SYNC STATUS */}
<div className="quiz-progress">
  <div className="progress-info">
    <span className="progress-text">
      Answered: {answeredCount} / {quiz.questions?.length || 0}
    </span>
    
    {timeLeft !== null ? (
      <span className="time-remaining">
        <span className="time-icon">⏱️</span>
        {formatTime(timeLeft)}
        {!isTimerRunning && <span className="timer-paused"> (Paused)</span>}
      </span>
    ) : (
      <span className="time-syncing">
        <div className="loading-spinner-small"></div>
        Syncing timer with teacher...
      </span>
    )}
  </div>
  
  <div className="progress-bar">
    <div 
      className="progress-fill"
      style={{ width: `${progressPercentage}%` }}
    ></div>
    
    {/* Time warning indicator */}
    {timeLeft !== null && timeLeft < 300 && timeLeft > 0 && (
      <div 
        className="time-warning-indicator"
        style={{ left: `${(1 - (timeLeft / (quiz.timeLimit * 60))) * 100}%` }}
      >
        ⚠️
      </div>
    )}
  </div>
</div>
=======
      {/* ✅ TIMER DISPLAY WITH SYNC STATUS */}
      <div className="quiz-progress">
        <div className="progress-info">
          <span className="progress-text">
            Answered: {answeredCount} / {quiz.questions?.length || 0}
          </span>
          
          {timeLeft !== null ? (
            <span className="time-remaining">
              <span className="time-icon"></span>
              {formatTime(timeLeft)}
              {!isTimerRunning && <span className="timer-paused"> (Paused)</span>}
            </span>
          ) : (
            <span className="time-syncing">
              <div className="loading-spinner-small"></div>
              Syncing timer with teacher...
            </span>
          )}
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
          
          {/* Time warning indicator */}
          {timeLeft !== null && timeLeft < 300 && timeLeft > 0 && (
            <div 
              className="time-warning-indicator"
              style={{ left: `${(1 - (timeLeft / (quiz.timeLimit * 60))) * 100}%` }}
            >
              ⚠️
            </div>
          )}
        </div>
      </div>
>>>>>>> backupRepo/main

      <div className="quiz-content">
        <div className="quiz-questions">
          {quiz.questions?.map((question, index) => (
            <div key={`question-${examId}-${index}`} className="question-card">
              <div className="question-header">
                <h3>Question {index + 1}</h3>
                <div className="question-meta">
                  {question.points > 0 && (
                    <span className="points-badge">{question.points} points</span>
                  )}
                  <span className="question-type">{question.type}</span>
                </div>
              </div>
              <div className="question-content">
                <p className="question-text">{question.title}</p>
                
                {question.description && (
                  <p className="question-description">{question.description}</p>
                )}
                
                {/* Multiple Choice Questions */}
                {question.type === 'multiple-choice' && question.options && (
                  <div className="options-list">
                    {question.options.map((option, optIndex) => (
                      <label key={`option-${index}-${optIndex}`} className="option-label">
                        <input 
                          type="radio" 
                          name={`question-${index}`} 
                          value={option}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          checked={answers[index] === option}
                        />
                        <span className="option-text">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {/* Checkbox Questions */}
                {question.type === 'checkboxes' && question.options && (
                  <div className="options-list">
                    {question.options.map((option, optIndex) => (
                      <label key={`option-${index}-${optIndex}`} className="option-label">
                        <input 
                          type="checkbox" 
                          value={option}
                          onChange={(e) => handleCheckboxChange(index, option, e.target.checked)}
                          checked={Array.isArray(answers[index]) ? answers[index].includes(option) : false}
                        />
                        <span className="option-text">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {/* Text Answer Questions */}
                {(question.type === 'short-answer' || question.type === 'paragraph') && (
                  <textarea
                    className="answer-textarea"
                    placeholder={question.type === 'short-answer' ? "Type your short answer here..." : "Type your detailed answer here..."}
                    rows={question.type === 'paragraph' ? 4 : 2}
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                  />
                )}
                
                {/* True/False Questions */}
                {question.type === 'true-false' && (
                  <div className="options-list">
                    <label className="option-label">
                      <input 
                        type="radio" 
                        name={`question-${index}`} 
                        value="true"
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        checked={answers[index] === 'true'}
                      />
                      <span className="option-text">True</span>
                    </label>
                    <label className="option-label">
                      <input 
                        type="radio" 
                        name={`question-${index}`} 
                        value="false"
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        checked={answers[index] === 'false'}
                      />
                      <span className="option-text">False</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="quiz-footer">
          <div className="footer-info">
            <span className="answered-count">
              {answeredCount} of {quiz.questions?.length || 0} questions answered
            </span>
            {/* ✅ USE SYNCED TIMER FOR WARNINGS */}
            {timeLeft !== null && timeLeft < 300 && (
              <span className="time-warning">
                ⚠️ {formatTime(timeLeft)} remaining
              </span>
            )}
          </div>
          <button 
            className={`submit-quiz-btn ${answeredCount === 0 ? 'disabled' : ''}`}
            onClick={() => handleSubmitQuiz(false)}
            disabled={submitting || answeredCount === 0}
          >
            {submitting ? (
              <>
                <div className="loading-spinner-small"></div>
                Submitting...
              </>
            ) : (
              `Submit Quiz ${answeredCount > 0 ? `(${answeredCount} answers)` : ''}`
            )}
          </button>
        </div>
      </div>

      {/* Microphone Component */}
      {requiresMicrophone && permissionsGranted && (
        <MicrophoneComponent 
          requiresMicrophone={requiresMicrophone}
          onMicrophoneStateChange={handleMicrophoneStateChange}
          onProctoringAlert={handleProctoringAlert}
          examId={examId}
        />
      )}

      {/* Camera Component for Exam Mode */}
      {requiresCamera && permissionsGranted && (
        <CameraComponent 
          requiresCamera={requiresCamera}
          onCameraStateChange={handleCameraStateChange}
          onProctoringAlert={handleProctoringAlert}
          examId={examId}
          teacherDetectionSettings={teacherDetectionSettings}
          socketRef={socketRef}
          tabSwitchCount={tabSwitchCount}
          windowBlurCount={windowBlurCount}
          microphoneActive={!micState.isMuted}
          isSpeaking={micState.isSpeaking}
<<<<<<< HEAD
          examType={examType}
=======
>>>>>>> backupRepo/main
        />
      )}

      {/* Chat Component */}
      <ChatComponent 
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        showChat={showChat}
        toggleChat={toggleChat}
        unreadCount={unreadCount}
      />
    </div>
  );
}