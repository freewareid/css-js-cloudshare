import { useState } from "react";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type FileUploadProps = {
  userId: string;
};

export const FileUpload = ({ userId }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const validateFileName = (name: string) => {
    const regex = /^[a-zA-Z0-9]{1,12}\.(css|js)$/;
    return regex.test(name);
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
    const validFiles = files.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return ["css", "js"].includes(extension || "");
    });

    if (validFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Only CSS and JS files are allowed",
        variant: "destructive",
      });
      return;
    }

    for (const file of validFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        continue;
      }

      if (!validateFileName(file.name)) {
        toast({
          title: "Invalid filename",
          description:
            "Filename must be 1-12 characters long and contain only letters and numbers",
          variant: "destructive",
        });
        continue;
      }

      try {
        setIsUploading(true);
        const filePath = `${userId}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("files")
          .getPublicUrl(filePath);

        await supabase.from("files").insert({
          user_id: userId,
          name: file.name,
          url: urlData.publicUrl,
          type: file.name.split(".").pop() || "",
          size: file.size,
        });

        toast({
          title: "File uploaded successfully",
          description: file.name,
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div
      className={`relative h-64 rounded-lg border-2 border-dashed p-8 transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Upload className="h-12 w-12 text-gray-400" />
        <div className="text-center">
          <p className="text-lg font-medium">
            {isUploading ? "Uploading..." : "Drag and drop your files here"}
          </p>
          <p className="text-sm text-gray-500">or</p>
          <label className="mt-2 inline-block cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
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
        <p className="text-sm text-gray-500">Only CSS and JS files are allowed</p>
      </div>
    </div>
  );
};