import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileGalleryList } from "./files/FileGalleryList";

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
  last_edited_at: string | null;
};

export const FileGallery = ({ userId }: FileGalleryProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const fetchFiles = async () => {
    console.log('Fetching files for user:', userId);
    const { data: filesData, error: filesError } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.error('Error fetching files:', filesError);
      toast({
        title: "Error fetching files",
        description: filesError.message,
        variant: "destructive",
      });
      return;
    }

    console.log('Files fetched:', filesData);
    setFiles(filesData as File[]);
  };

  useEffect(() => {
    fetchFiles();

    // Subscribe to realtime changes
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
        (payload) => {
          console.log('Realtime update received:', payload);
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
      
      fetchFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error deleting file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return <FileGalleryList files={files} onDelete={deleteFile} />;
};