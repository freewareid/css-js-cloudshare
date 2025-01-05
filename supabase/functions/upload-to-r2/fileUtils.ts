import { PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0";
import type { S3Client } from "https://esm.sh/@aws-sdk/client-s3@3.370.0";

export const validateFile = (file: File) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!['css', 'js'].includes(extension || '')) {
    throw new Error('Invalid file type. Only CSS and JS files are allowed.');
  }

  if (file.size > 1024 * 1024) {
    throw new Error('File size exceeds 1MB limit');
  }
};

export const compressCSS = (css: string): string => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .trim();
};

export const uploadFileToR2 = async (
  R2: S3Client,
  key: string,
  fileContent: string | ArrayBuffer,
  contentType: string
) => {
  console.log('Uploading file to R2:', { key, contentType });
  
  const uploadCommand = new PutObjectCommand({
    Bucket: "st8",
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });

  await R2.send(uploadCommand);
  return `https://pub-c7fe5d7345b64a8aa90756d140154223.r2.dev/${key}`;
};