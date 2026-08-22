/**
 * Cloudinary Service for media uploads
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Determines the Cloudinary resource_type based on the file's MIME type.
 * @param {File} file 
 * @returns {"image" | "video" | "raw"}
 */
export const getResourceType = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) return 'video';
  // Fallback to "raw" for documents (pdf, docx, zip, etc.)
  return 'raw';
};

/**
 * Uploads a file to Cloudinary using XMLHttpRequest to track progress.
 * @param {File} file - The file to upload.
 * @param {string} resourceType - The Cloudinary resource type ("image", "video", "raw").
 * @param {function} onProgress - Callback for upload progress (receives percentage 0-100).
 * @returns {{ uploadPromise: Promise<object>, xhr: XMLHttpRequest }} - Resolves with the Cloudinary response object.
 */
export const uploadToCloudinary = (file, resourceType, onProgress) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary environment variables are missing.');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
  const xhr = new XMLHttpRequest();
  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const uploadPromise = new Promise((resolve, reject) => {
    // Progress event
    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    // Load event
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          console.error('Cloudinary HTTP Error:', xhr.status, errorResponse);
          reject(new Error(errorResponse.error?.message || 'Upload failed'));
        } catch (error) {
          console.error('Cloudinary HTTP Error:', xhr.status, xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Error event
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    // Abort event
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled by user'));
    });

    xhr.open('POST', url, true);
    xhr.send(formData);
  });

  return { uploadPromise, xhr };
};
