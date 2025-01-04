import { useState } from "react";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const FileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

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

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['css', 'js'].includes(extension || '');
    });

    if (validFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Only CSS and JS files are allowed",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement actual file upload
    toast({
      title: "Files ready",
      description: `${validFiles.length} files selected for upload`,
    });
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
          <p className="text-lg font-medium">Drag and drop your files here</p>
          <p className="text-sm text-gray-500">or</p>
          <label className="mt-2 inline-block cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Browse Files
            <input
              type="file"
              className="hidden"
              accept=".css,.js"
              multiple
              onChange={handleFileInput}
            />
          </label>
        </div>
        <p className="text-sm text-gray-500">Only CSS and JS files are allowed</p>
      </div>
    </div>
  );
};