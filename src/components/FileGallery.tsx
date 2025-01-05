import { useEffect, useState } from "react";
import { FileCode, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 1024 * 1024 * 1024 });
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
    setStorageInfo(prev => ({ ...prev, used: profileData.storage_used }));
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
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-medium">Storage Usage</h3>
        <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(storageUsedPercentage, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {formatFileSize(storageInfo.used)} used of {formatFileSize(storageInfo.total)}
        </p>
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
            <button
              onClick={() => deleteFile(file)}
              className="absolute right-2 top-2 hidden rounded-md p-1 text-red-500 hover:bg-red-50 group-hover:block"
              title="Delete file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};