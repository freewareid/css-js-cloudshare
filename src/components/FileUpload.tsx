import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateFile } from "@/utils/fileUtils";

type FileUploadProps = {
  userId: string;
  onUploadSuccess?: () => void;
};

export const FileUpload = ({ userId, onUploadSuccess }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file => {
      try {
        validateFile(file);
        return true;
      } catch (error: any) {
        toast({
          title: "Invalid file",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    });

    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      try {
        setIsUploading(true);
        console.log('Starting file upload:', file.name);
        
        const fileContent = await file.text();
        console.log('File content loaded, sending to edge function');

        const { data, error } = await supabase.functions.invoke('upload-to-r2', {
          body: {
            fileName: file.name,
            fileType: file.type,
            userId: userId,
            fileContent: fileContent,
          }
        });

        console.log('Upload response:', { data, error });

        if (error) throw error;

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
  }, [userId, onUploadSuccess, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  }, [handleFiles]);

  return (
    <div
      className={`relative h-48 rounded-lg border-2 border-dashed p-6 transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-gray-300"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
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