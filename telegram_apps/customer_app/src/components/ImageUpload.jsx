import React, { useState, useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { cn } from '@/utils/cn';

const ImageUpload = ({
  value,
  onChange,
  label,
  type = 'avatars', // avatars for profile photos
  className,
  ...props
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadUrl = props.uploadUrl || `/api/upload/${type}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const imageUrl = result.data.url;

      setPreview(imageUrl);
      onChange(imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Profile photo"
              className="w-24 h-24 object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClick}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={cn(
              'w-24 h-24 rounded-full border-4 border-dashed flex items-center justify-center cursor-pointer transition-all shadow-lg',
              isUploading
                ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            )}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-400"></div>
            ) : (
              <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          {...props}
        />
      </div>

      {preview && (
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tap the camera icon to change photo
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;