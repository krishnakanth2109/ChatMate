// src/components/chat/ChatInput.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Helper function to get the cropped image data from the cropper UI
function getCroppedImg(image, crop) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg');
  });
}

const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const mediaInputRef = useRef(null);
  
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);

  const [recordingStatus, setRecordingStatus] = useState('idle');
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const handleSendText = (e) => { e.preventDefault(); if (message.trim()) { onSendMessage({ messageType: 'text', content: message }); setMessage(''); } };
  
  const handleSendLocation = () => {
    setShowAttachMenu(false);
    navigator.geolocation?.getCurrentPosition(
      pos => onSendMessage({ messageType: 'location', location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
      () => alert("Could not get your location.")
    );
  };
  
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const type = e.target.dataset.type;
    
    setIsUploading(true);
    setShowAttachMenu(false);
    
    const formData = new FormData();
    formData.append('media', file);

    try {
      const response = await api.post('/upload/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      if (type === 'document') {
        onSendMessage({ messageType: 'document', fileUrl: response.data.filePath, fileName: response.data.fileName });
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} upload failed.`);
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    setShowAttachMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStatus('recording');
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.start();
      mediaRecorder.current.ondataavailable = event => audioChunks.current.push(event.data);
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Microphone access is required for voice messages.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecordingStatus('recorded');
  };
  
  const handleSendVoice = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    if (!audioBlob || audioBlob.size === 0) return;
    
    setIsUploading(true);
    setRecordingStatus('idle');

    const formData = new FormData();
    formData.append('media', audioBlob, 'voice-message.webm');

    try {
      const response = await api.post('/upload/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSendMessage({ messageType: 'voice', fileUrl: response.data.filePath });
    } catch (error) {
      console.error("Error uploading voice message:", error);
    } finally {
      setIsUploading(false);
      audioChunks.current = [];
    }
  };
  
  const onSelectImageForCrop = (e) => {
    setShowAttachMenu(false);
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(String(reader.result)));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height));
  };

  const handleSendCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsUploading(true);
    const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
    const formData = new FormData();
    formData.append('media', croppedImageBlob, 'cropped-image.jpeg');
    try {
      const response = await api.post('/upload/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSendMessage({ messageType: 'image', fileUrl: response.data.filePath });
      setImgSrc('');
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  if (imgSrc) {
    return (
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4">
        <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1}>
          <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview"/>
        </ReactCrop>
        <div className="mt-4 flex space-x-4">
          <button onClick={handleSendCroppedImage} disabled={isUploading} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold disabled:bg-gray-500">
            {isUploading ? 'Sending...' : 'Send Image'}
          </button>
          <button onClick={() => setImgSrc('')} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-4 bg-transparent md:px-6 md:pb-6">
      <AnimatePresence>
        {showAttachMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute bottom-20 left-4 md:left-6 w-56 bg-[#1e1e1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            <button onClick={() => mediaInputRef.current.click()} className="flex items-center w-full px-5 py-3.5 text-left text-white hover:bg-white/10 transition-colors">
              <input type="file" accept="image/*" onChange={onSelectImageForCrop} style={{ display: 'none' }} ref={mediaInputRef} />
              <span className="text-xl">🖼️</span> <span className="ml-3 font-medium">Image</span>
            </button>
            <div className="h-px w-full bg-white/5"></div>
            <button onClick={() => mediaInputRef.current.click()} className="flex items-center w-full px-5 py-3.5 text-left text-white hover:bg-white/10 transition-colors">
              <input type="file" accept=".pdf,.doc,.docx" data-type="document" onChange={handleFileSelect} style={{ display: 'none' }} />
              <span className="text-xl">📄</span> <span className="ml-3 font-medium">Document</span>
            </button>
            <div className="h-px w-full bg-white/5"></div>
            <button onClick={handleSendLocation} className="flex items-center w-full px-5 py-3.5 text-left text-white hover:bg-white/10 transition-colors">
              <span className="text-xl">📍</span> <span className="ml-3 font-medium">Location</span>
            </button>
            <div className="h-px w-full bg-white/5"></div>
            <button onClick={startRecording} className="flex items-center w-full px-5 py-3.5 text-left text-white hover:bg-white/10 transition-colors">
              <span className="text-xl">🎤</span> <span className="ml-3 font-medium">Voice Record</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {recordingStatus === 'recorded' ? (
        <div className="flex items-center justify-between bg-[#1e1e1e] border border-white/10 rounded-full px-6 py-3 shadow-lg">
          <p className="text-white font-medium flex items-center"><span className="animate-pulse mr-2 text-red-500">●</span> Voice message ready</p>
          <div className="flex space-x-2">
            <button onClick={() => { setRecordingStatus('idle'); audioChunks.current = []; }} className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button onClick={handleSendVoice} disabled={isUploading} className="bg-gradient-to-tr from-purple-600 to-blue-500 text-white px-4 py-1.5 rounded-full font-semibold shadow-md disabled:opacity-50">
              {isUploading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendText} className="flex items-center space-x-3">
          <div className="flex-1 flex items-center bg-[#1e1e1e]/60 backdrop-blur-md border border-white/10 rounded-full pl-2 pr-2 py-1.5 shadow-inner">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              type="button" 
              onClick={() => setShowAttachMenu(prev => !prev)} 
              className={`p-2.5 rounded-full transition-colors ${showAttachMenu ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </motion.button>
            
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={recordingStatus === 'recording' ? 'Listening...' : 'Message...'}
              disabled={recordingStatus === 'recording'}
              className="flex-1 px-3 py-2 bg-transparent text-white placeholder-white/40 focus:outline-none text-base disabled:opacity-50"
            />
            
            {recordingStatus === 'recording' ? (
              <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={stopRecording} className="p-2.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all mx-1 flex items-center">
                <span className="w-2.5 h-2.5 rounded-sm bg-current mr-2"></span> Stop
              </motion.button>
            ) : (
              message.trim() ? (
                <motion.button 
                  initial={{ scale: 0, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  type="submit" 
                  className="p-2.5 bg-gradient-to-tr from-purple-600 to-blue-500 text-white rounded-full shadow-md ml-1"
                >
                  <svg className="w-5 h-5 translate-x-0.5 -translate-y-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </motion.button>
              ) : (
                <button type="button" onClick={startRecording} className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
              )
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatInput;