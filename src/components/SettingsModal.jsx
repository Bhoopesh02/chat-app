import React, { useState, useRef, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, User, Lock, Mail, Camera, Image as ImageIcon, Trash2, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { chatService } from '../services/chatService';
import Cropper from 'react-easy-crop';
import { uploadToCloudinary } from '../services/cloudinaryService';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        file.name = "avatar.jpg";
        resolve(file);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, 'image/jpeg', 0.9);
  });
};

const SettingsModal = ({ user, onClose }) => {
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'profile', 'privacy'

  // Profile state
  const [savedName, setSavedName] = useState(user.name);
  const [newName, setNewName] = useState(user.name);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameMessage, setNameMessage] = useState('');

  // Privacy state
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Avatar flow state
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      const imageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      setCropImage(imageDataUrl);
      setShowAvatarMenu(false);
      setAvatarError('');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      e.target.value = ''; // Reset input
    }
  };

  const handleSaveAvatar = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    setIsUploadingAvatar(true);
    setAvatarError('');
    
    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      
      const { uploadPromise } = uploadToCloudinary(croppedFile, 'image', null);
      const result = await uploadPromise;
      
      const newAvatarUrl = result.secure_url;
      
      // Update RTDB (source of truth)
      await chatService.updateUserAvatar(user.uid, newAvatarUrl);
      
      // Sync with Firebase Auth photoURL
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: newAvatarUrl
        });
      }
      
      setCropImage(null);
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setAvatarError('Failed to update avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      await chatService.updateUserAvatar(user.uid, null);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: null
        });
      }
      setShowAvatarMenu(false);
    } catch (err) {
      console.error('Failed to remove avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateName = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === savedName) return;
    setIsUpdatingName(true);
    setNameMessage('');
    try {
      // Update Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: trimmed
        });
      }

      // Update RTDB
      await chatService.updateUserName(user.uid, trimmed);

      setSavedName(trimmed);
      setNameMessage('Name updated successfully!');
      alert("Name updated successfully!");
    } catch (err) {
      console.error(err);
      setNameMessage('Failed to update name');
      alert("Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async () => {
    setIsUpdatingPassword(true);
    setPasswordMessage('');
    try {
      if (auth.currentUser) {
        await sendPasswordResetEmail(auth, user.email);
        setPasswordMessage("Password reset link sent to your email!");
      }
    } catch (err) {
      console.error(err);
      setPasswordMessage("Failed to send reset link.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal-content" 
        style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
          {currentView !== 'menu' && (
            <button className="btn-icon" onClick={() => setCurrentView('menu')} style={{ marginRight: 'auto', padding: '0.25rem' }}>
              <ChevronLeft size={20} />
            </button>
          )}

          <h2 style={{
            fontSize: '1.125rem', fontWeight: '600', flex: 1, textAlign: 'center', margin: 0,
            marginLeft: currentView === 'menu' ? '28px' : '0',
            marginRight: currentView !== 'menu' ? '28px' : '0'
          }}>
            {currentView === 'menu' ? 'Settings' : currentView === 'profile' ? 'Profile' : 'Privacy Settings'}
          </h2>

          {currentView === 'menu' && (
            <button className="btn-icon" onClick={onClose} style={{ marginLeft: 'auto', padding: '0.25rem' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--surface-color)' }}>

          {currentView === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards' }}>
              <div style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Account
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', padding: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'background-color var(--transition-fast)' }}
                onClick={() => setCurrentView('profile')}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User size={18} style={{ marginRight: '1rem', color: 'var(--text-secondary)' }} />
                <span style={{ flex: 1, fontWeight: '500', fontSize: '0.9375rem' }}>Profile</span>
                <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', padding: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'background-color var(--transition-fast)' }}
                onClick={() => setCurrentView('privacy')}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Lock size={18} style={{ marginRight: '1rem', color: 'var(--text-secondary)' }} />
                <span style={{ flex: 1, fontWeight: '500', fontSize: '0.9375rem' }}>Privacy Settings</span>
                <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards' }}>
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <div 
                  onClick={() => setShowAvatarMenu(true)}
                  style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
                >
                  <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(savedName)}`} 
                    alt={savedName} 
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)', backgroundColor: 'var(--background-color)' }} 
                  />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-color)' }}>
                    <Camera size={14} />
                  </div>
                </div>

                {showAvatarMenu && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                      onClick={() => setShowAvatarMenu(false)}
                    />
                    <div style={{ 
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', 
                      backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)', padding: '0.5rem 0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                      zIndex: 11, width: '180px', marginTop: '8px'
                    }}>
                      <button 
                        onClick={() => { cameraInputRef.current?.click(); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                      >
                        <Camera size={16} /> Take Photo
                      </button>
                      <button 
                        onClick={() => { fileInputRef.current?.click(); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                      >
                        <ImageIcon size={16} /> Choose from Gallery
                      </button>
                      {user.avatar && (
                        <button 
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}
                        >
                          <Trash2 size={16} /> {isUploadingAvatar ? 'Removing...' : 'Remove Photo'}
                        </button>
                      )}
                    </div>
                  </>
                )}
                <input type="file" accept="image/*" capture="user" ref={cameraInputRef} style={{ display: 'none' }} onChange={onFileChange} />
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} />
              </div>

              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Username</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (nameMessage) setNameMessage('');
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9375rem', backgroundColor: 'var(--background-color)', outline: 'none' }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleUpdateName}
                    disabled={isUpdatingName || !newName.trim() || newName.trim() === savedName}
                    style={{ width: '100%' }}
                  >
                    {isUpdatingName ? 'Saving...' : 'Save Changes'}
                  </button>
                  {nameMessage && (
                    <div style={{ fontSize: '0.8125rem', color: nameMessage.includes('success') ? 'var(--success-color)' : 'var(--danger-color)', textAlign: 'center', animation: 'slideDown var(--transition-fast) var(--ease-out-expo) forwards' }}>
                      {nameMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === 'privacy' && (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards' }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email Address</label>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <Mail size={16} style={{ marginRight: '0.75rem', color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{user.email}</span>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Default timer for new individual chats</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <select
                    value={user.defaultDisappearingDuration || ""}
                    onChange={(e) => chatService.updateDefaultDisappearingDuration(user.uid, e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9375rem', backgroundColor: 'var(--background-color)', outline: 'none', color: 'var(--text-primary)' }}
                  >
                    <option value="">Off</option>
                    <option value="86400000">24 hours</option>
                    <option value="604800000">7 days</option>
                    <option value="7776000000">90 days</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Change Password</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    className="btn-primary"
                    onClick={handleChangePassword}
                    disabled={isUpdatingPassword}
                    style={{ width: '100%' }}
                  >
                    {isUpdatingPassword ? 'Sending...' : 'Send Password Reset Link'}
                  </button>

                  {passwordMessage && (
                    <div style={{ fontSize: '0.8125rem', color: passwordMessage.includes('success') || passwordMessage.includes('sent') ? 'var(--success-color)' : 'var(--danger-color)', textAlign: 'center', animation: 'slideDown var(--transition-fast) var(--ease-out-expo) forwards' }}>
                      {passwordMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
      
      {/* Full-screen crop modal */}
      {cropImage && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'black', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', color: 'white', borderBottom: '1px solid #333' }}>
            <button 
              onClick={() => { setCropImage(null); setAvatarError(''); }}
              disabled={isUploadingAvatar}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={24} />
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: '600', fontSize: '1.125rem' }}>Edit Photo</div>
            <div style={{ width: '24px' }}></div> {/* Spacer for centering */}
          </div>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          </div>

          {avatarError && (
            <div style={{ color: 'var(--danger-color)', textAlign: 'center', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.8)' }}>
              {avatarError}
            </div>
          )}

          <div style={{ padding: '1.5rem', backgroundColor: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={() => setRotation((r) => r + 90)}
              disabled={isUploadingAvatar}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RotateCw size={24} />
            </button>

            <button
              onClick={handleSaveAvatar}
              disabled={isUploadingAvatar}
              style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '2rem', fontWeight: '600', cursor: 'pointer', opacity: isUploadingAvatar ? 0.7 : 1 }}
            >
              {isUploadingAvatar ? 'Saving...' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SettingsModal;
