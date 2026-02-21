'use client';

import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/glass';

interface ImageUploadProps {
  onTextExtracted: (text: string) => void;
}

export default function ImageUpload({ onTextExtracted }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extractedText = result.data.text.trim();

      if (extractedText.length < 10) {
        alert('Could not extract enough text. Try a clearer screenshot.');
        setUploading(false);
        setPreview(null);
        return;
      }

      onTextExtracted(extractedText);
      setUploading(false);
      setPreview(null);
    } catch (error) {
      console.error('OCR error:', error);
      alert('Failed to extract text. Try again.');
      setUploading(false);
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleImageUpload(file);
        break;
      }
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard
        className="relative p-8 cursor-pointer hover:border-pink-500/50 transition"
        onDrop={handleDrop}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        {!uploading && !preview && (
          <div className="text-center space-y-3">
            <div className="text-5xl">📸</div>
            <div className="text-white font-bold text-lg">Drop screenshot here</div>
            <div className="text-white/50 text-sm">
              or click to browse • paste with Cmd/Ctrl+V
            </div>
            <div className="text-xs text-white/40">
              Works with iMessage, WhatsApp, Instagram DMs
            </div>
          </div>
        )}

        {preview && !uploading && (
          <div className="space-y-3 text-center">
            <img
              src={preview}
              alt="Preview"
              className="max-h-40 mx-auto rounded-lg border border-white/20"
            />
            <div className="text-sm text-white/60">Processing image...</div>
          </div>
        )}

        {uploading && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">🔍</div>
            <div className="text-white font-bold">Extracting text...</div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-sm text-white/60">{progress}%</div>
          </div>
        )}
      </GlassCard>

      <div
        onPaste={handlePaste}
        tabIndex={0}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/50"
      >
        💡 Tip: Screenshot messages → paste here with{' '}
        <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Cmd/Ctrl+V</kbd>
      </div>
    </div>
  );
}