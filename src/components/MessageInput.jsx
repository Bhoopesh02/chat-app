import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Plus, X, Mic, Image as ImageIcon, FileText, Camera, 
  Music, MapPin, User, BarChart2, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary, getResourceType } from '../services/cloudinaryService';
import CreatePollModal from './CreatePollModal';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'application/zip', 'application/x-zip-compressed',
  'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MessageInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  
  // File state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const xhrRef = useRef(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Audio recording timer (max 3 minutes)
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 180) {
            // Auto stop at 3 minutes
            stopAndPromptSend();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRecording]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [text]);

  const triggerFile = (accept, capture = null, multiple = false) => {
    setMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      if (capture) {
        fileInputRef.current.setAttribute('capture', capture);
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      if (multiple) {
        fileInputRef.current.setAttribute('multiple', 'true');
      } else {
        fileInputRef.current.removeAttribute('multiple');
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFileError('');
    setUploadError('');
    if (!files.length) return;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File ${file.name} exceeds 10MB limit.`);
        e.target.value = null;
        return;
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('audio/')) {
        setFileError(`File ${file.name} is an unsupported file type.`);
        e.target.value = null;
        return;
      }
    }

    setSelectedFiles(files);
  };

  const handleClearFile = () => {
    setSelectedFiles([]);
    setFileError('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current && Array.isArray(xhrRef.current)) {
      xhrRef.current.forEach(xhr => xhr && xhr.abort());
    } else if (xhrRef.current) {
      xhrRef.current.abort();
    }
    xhrRef.current = null;
    setIsUploading(false);
    setUploadProgress(0);
    handleClearFile();
  };

  const handleSend = async () => {
    const messageText = text.trim().slice(0, 100);
    if (!messageText && selectedFiles.length === 0) return;

    let mediaData = null;

    if (selectedFiles.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError('');

      try {
        const uploadPromises = selectedFiles.map((file, index) => {
          const resourceType = getResourceType(file);
          const { uploadPromise, xhr } = uploadToCloudinary(file, resourceType, (progress) => {
            // Simplified progress tracking for batch (averaging)
            // In a real app, track individual and compute total
            setUploadProgress(prev => Math.max(prev, progress));
          });
          
          if (!xhrRef.current) xhrRef.current = [];
          xhrRef.current[index] = xhr;
          
          return uploadPromise.then(response => {
            const type = file.type.startsWith('audio/') ? 'audio' : resourceType;
            let thumbnailUrl = null;
            if (type === 'video') {
              thumbnailUrl = response.secure_url.replace(/\.[^/.]+$/, ".jpg");
            }
            return {
              type,
              mediaUrl: response.secure_url,
              mediaPublicId: response.public_id,
              fileName: file.name || 'Voice message',
              fileFormat: response.format || (file.name ? file.name.split('.').pop() : 'webm'),
              thumbnailUrl,
              width: response.width,
              height: response.height
            };
          });
        });

        const results = await Promise.all(uploadPromises);

        if (results.length === 1) {
          mediaData = results[0];
        } else {
          mediaData = {
            type: 'album',
            media: results
          };
        }
      } catch (err) {
        setIsUploading(false);
        console.error('Cloudinary upload error:', err);
        if (err.message !== 'Upload cancelled by user') {
          setUploadError(err.message || 'Failed to upload files. Please try again.');
        }
        return;
      } finally {
        setIsUploading(false);
        xhrRef.current = null;
      }
    }

    onSendMessage(messageText, mediaData);
    setText('');
    handleClearFile();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSendPoll = (pollPayload) => {
    onSendMessage('', pollPayload);
    setIsCreatePollOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isUploading && !isRecording) {
        handleSend();
      }
    }
  };

  // Audio recording methods
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setFileError('Microphone permission denied.');
    }
  };

  const stopAndPromptSend = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Show confirm prompt for max limit
        if (window.confirm("Audio recording reached 3 minutes. Send it now?")) {
          const audioFile = new File([audioBlob], 'audio_record.webm', { type: 'audio/webm' });
          setSelectedFiles([audioFile]);
          setIsRecording(false);
          // Wait for state to settle then send
          setTimeout(() => {
            document.getElementById('hidden-send-trigger')?.click();
          }, 100);
        } else {
          cancelRecording();
        }
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'audio_record.webm', { type: 'audio/webm' });
        setSelectedFiles([audioFile]);
        setIsRecording(false);
        // Automate sending process slightly after setting file
        setTimeout(() => {
          document.getElementById('hidden-send-trigger')?.click();
        }, 100);
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    } else {
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setMenuOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access denied or error:", err);
      setFileError('Camera permission denied.');
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFiles([file]);
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const isFinalCountdown = recordingTime >= 165; // Final 15 seconds

  return (
    <div className="composer-container">
      {fileError && <div className="input-error-msg">{fileError}</div>}
      {uploadError && <div className="input-error-msg">{uploadError}</div>}
      
      {isCreatePollOpen && (
        <CreatePollModal 
          onClose={() => setIsCreatePollOpen(false)}
          onSendPoll={handleSendPoll}
        />
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="camera-modal">
          <div className="camera-container">
            <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
            <div className="camera-controls">
              <button className="camera-close-btn" onClick={stopCamera} title="Close Camera">
                <X size={24} />
              </button>
              <button className="camera-capture-btn" onClick={capturePhoto} title="Take Photo">
                <div className="camera-capture-inner"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview before/during upload */}
      {selectedFiles.length > 0 && !isRecording && (
        <div className="file-preview-container">
          <div className="file-preview-info">
            <span className="file-name">
              {selectedFiles.length === 1 ? selectedFiles[0].name || 'Audio snippet' : `${selectedFiles.length} files selected`}
            </span>
            {selectedFiles.length === 1 && (
              <span className="file-size">{(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB</span>
            )}
          </div>
          
          {isUploading ? (
            <div className="upload-progress-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="progress-text">{uploadProgress}%</span>
              <button className="cancel-upload-btn" onClick={handleCancelUpload} title="Cancel upload">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button className="clear-file-btn" onClick={handleClearFile} title="Remove file">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Hidden button to auto-trigger send after audio record finishes */}
      <button id="hidden-send-trigger" style={{ display: 'none' }} onClick={handleSend}></button>

      <div className="composer-bar">
        {isRecording ? (
          <div className="recording-ui">
            <div className="recording-timer">
              <div className={`record-dot ${isFinalCountdown ? 'blink-fast' : 'blink'}`}></div>
              <span className={`recording-time ${isFinalCountdown ? 'time-warning' : ''}`}>
                {formatTime(recordingTime)}
              </span>
            </div>
            <div className="recording-actions">
              <button className="rec-cancel-btn" onClick={cancelRecording} title="Cancel">
                <Trash2 size={20} />
              </button>
              <button className="rec-send-btn" onClick={stopAndSendRecording} title="Send">
                <Send size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="composer-input-row">
            <div className="attachment-wrapper" ref={menuRef}>
              <motion.button 
                className={`plus-btn ${menuOpen ? 'active' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                disabled={isUploading}
                title="Attach"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={24} className={menuOpen ? 'rotated' : ''} />
              </motion.button>
              
              <AnimatePresence>
              {menuOpen && (
                <motion.div 
                  className="attachment-menu"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <button className="attach-item" onClick={() => triggerFile('image/*,video/*', null, true)}>
                    <span className="icon-bg icon-photos"><ImageIcon size={18} /></span>
                    Photos & Videos
                  </button>
                  <button className="attach-item" onClick={() => triggerFile('*/*', null, true)}>
                    <span className="icon-bg icon-doc"><FileText size={18} /></span>
                    Document
                  </button>
                  <button className="attach-item" onClick={startCamera}>
                    <span className="icon-bg icon-camera"><Camera size={18} /></span>
                    Camera
                  </button>
                  <button className="attach-item" onClick={() => triggerFile('audio/*')}>
                    <span className="icon-bg icon-audio"><Music size={18} /></span>
                    Audio
                  </button>
                  <button className="attach-item" onClick={() => { console.log('Location stub'); setMenuOpen(false); }}>
                    <span className="icon-bg icon-location"><MapPin size={18} /></span>
                    Location
                  </button>
                  <button className="attach-item" onClick={() => { console.log('Contact stub'); setMenuOpen(false); }}>
                    <span className="icon-bg icon-contact"><User size={18} /></span>
                    Contact
                  </button>
                  <button className="attach-item" onClick={() => { setIsCreatePollOpen(true); setMenuOpen(false); }}>
                    <span className="icon-bg icon-poll"><BarChart2 size={18} /></span>
                    Poll
                  </button>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <div className="textarea-wrapper">
              <textarea 
                ref={textareaRef}
                placeholder="Message"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 100))}
                maxLength={100}
                onKeyDown={handleKeyDown}
                rows="1"
                disabled={isUploading}
              />
              {text.length > 0 && (
                <span className={`char-counter ${text.length >= 90 ? 'limit-near' : ''}`}>
                  {text.length}/100
                </span>
              )}
            </div>
            
            <motion.button 
              className={`composer-action-btn ${text.trim() || selectedFiles.length > 0 ? 'is-send' : 'is-mic'}`} 
              onClick={text.trim() || selectedFiles.length > 0 ? handleSend : startRecording}
              disabled={isUploading}
              title={text.trim() || selectedFiles.length > 0 ? 'Send' : 'Record Voice Message'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {text.trim() || selectedFiles.length > 0 ? <Send size={20} /> : <Mic size={20} />}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
