import { useState } from "react";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type FileUploadProps = {
  userId: string;
  onUploadSuccess?: () => void;
};

export const FileUpload = ({ userId, onUploadSuccess }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const validateFileExtension = (name: string) => {
    const extension = name.split('.').pop()?.toLowerCase();
    return extension === 'css' || extension === 'js';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => validateFileExtension(file.name));

    if (validFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Only CSS and JS files are allowed",
        variant: "destructive",
      });
      return;
    }

    for (const file of validFiles) {
      if (file.size > 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 1MB",
          variant: "destructive",
        });
        continue;
      }

      try {
        setIsUploading(true);
        
        const { data, error } = await supabase.functions.invoke('upload-to-r2', {
          body: {
            fileName: file.name,
            fileType: file.type,
            userId: userId,
            fileContent: await file.text(),
          }
        });

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        if (!data?.url) {
          throw new Error('No URL returned from upload');
        }

        toast({
          title: "File uploaded successfully",
          description: file.name,
        });

        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div
      className={`relative h-48 rounded-lg border-2 border-dashed p-6 transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Upload className="h-8 w-8 text-gray-400" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {isUploading ? "Uploading..." : "Drag and drop your files here"}
          </p>
          <p className="text-xs text-gray-500 mt-1">or</p>
          <label className="mt-2 inline-block cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90">
            Browse Files
            <input
              type="file"
              className="hidden"
              accept=".css,.js"
              multiple
              onChange={handleFileInput}
              disabled={isUploading}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Maximum file size: 1MB. Only CSS and JS files are allowed.
        </p>
      </div>
    </div>
  );
};