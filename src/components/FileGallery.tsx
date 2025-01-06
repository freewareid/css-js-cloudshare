import { useEffect, useState } from "react";
import { FileCode, Trash2, Copy, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

type FileGalleryProps = {
  userId: string;
};

type File = {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: "css" | "js";
  size: number;
  created_at: string;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileGallery = ({ userId }: FileGalleryProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [storageInfo, setStorageInfo] = useState({ 
    used: 0, 
    total: 1024 * 1024 * 1024, // 1GB in bytes
    fileCount: 0 
  });
  const { toast } = useToast();

  const fetchFiles = async () => {
    const { data: filesData, error: filesError } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .order('created_at', { ascending: false });

    if (filesError) {
      toast({
        title: "Error fetching files",
        description: filesError.message,
        variant: "destructive",
      });
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("storage_used")
      .eq("id", userId)
      .single();

    if (profileError) {
      toast({
        title: "Error fetching storage info",
        description: profileError.message,
        variant: "destructive",
      });
      return;
    }

    setFiles(filesData as File[]);
    setStorageInfo(prev => ({ 
      ...prev, 
      used: profileData.storage_used,
      fileCount: filesData?.length || 0
    }));
  };

  useEffect(() => {
    fetchFiles();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:files')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The URL has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const deleteFile = async (file: File) => {
    try {
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      toast({
        title: "File deleted",
        description: file.name,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const storageUsedPercentage = (storageInfo.used / storageInfo.total) * 100;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Storage Usage</h3>
          <p className="text-sm text-gray-500">
            {storageInfo.fileCount} file{storageInfo.fileCount !== 1 ? 's' : ''} stored
          </p>
        </div>
        
        <div className="space-y-2">
          <Progress value={storageUsedPercentage} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatFileSize(storageInfo.used)} used</span>
            <span>{formatFileSize(storageInfo.total - storageInfo.used)} available</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="group relative rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              <span className="font-medium">{file.name}</span>
            </div>
            <div className="mb-2 text-sm text-gray-500">
              {formatFileSize(file.size)}
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={file.url}
                className="w-full rounded-md bg-gray-50 px-3 py-1 text-sm"
              />
              <button
                onClick={() => copyToClipboard(file.url)}
                className="rounded-md p-2 hover:bg-gray-100"
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute right-2 top-2 hidden space-x-1 group-hover:flex">
              {file.type === 'css' && (
                <button
                  onClick={() => {/* CSS editor functionality will be added later */}}
                  className="rounded-md p-1 text-blue-500 hover:bg-blue-50"
                  title="Edit CSS"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => deleteFile(file)}
                className="rounded-md p-1 text-red-500 hover:bg-red-50"
                title="Delete file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};