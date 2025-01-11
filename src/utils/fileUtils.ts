export const validateFile = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!['css', 'js'].includes(extension || '')) {
    throw new Error('Only CSS and JS files are allowed');
  }

  if (file.size > 1024 * 1024) {
    throw new Error('Maximum file size is 1MB');
  }
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};