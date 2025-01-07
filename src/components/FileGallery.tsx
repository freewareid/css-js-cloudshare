import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StorageUsage } from "./storage/StorageUsage";
import { FileCard } from "./files/FileCard";
import { CSSEditor } from "./editors/CSSEditor";
import { Loader2 } from "lucide-react";

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

export const FileGallery = ({ userId }: FileGalleryProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [storageInfo, setStorageInfo] = useState({ 
    used: 0, 
    total: 1024 * 1024 * 1024, // 1GB in bytes
    fileCount: 0 
  });
  const [editingFile, setEditingFile] = useState<{ id: string; content: string } | null>(null);
  const [isLoadingEditor, setIsLoadingEditor] = useState(false);
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

  const deleteFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      toast({
        title: "File deleted",
        description: file.name,
      });
      
      // Refresh files after deletion
      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Error deleting file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setIsLoadingEditor(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-file-content', {
        body: { fileId }
      });

      if (error) throw error;

      setEditingFile({ id: fileId, content: data.content });
    } catch (error: any) {
      toast({
        title: "Error loading file",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingEditor(false);
    }
  };

  return (
    <div className="space-y-6">
      <StorageUsage
        used={storageInfo.used}
        total={storageInfo.total}
        fileCount={storageInfo.fileCount}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <FileCard
            key={file.id}
            id={file.id}
            name={file.name}
            url={file.url}
            size={file.size}
            type={file.type}
            onDelete={deleteFile}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {isLoadingEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-gray-600">Loading editor...</p>
          </div>
        </div>
      )}

      {editingFile && !isLoadingEditor && (
        <CSSEditor
          fileId={editingFile.id}
          initialContent={editingFile.content}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
};