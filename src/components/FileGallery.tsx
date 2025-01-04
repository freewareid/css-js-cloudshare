import { useEffect, useState } from "react";
import { FileCode, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type FileGalleryProps = {
  userId: string;
};

type File = {
  id: string;
  name: string;
  url: string;
  type: "css" | "js";
  size: number;
};

export const FileGallery = ({ userId }: FileGalleryProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error fetching files",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setFiles(data);
  };

  useEffect(() => {
    fetchFiles();
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
      const filePath = `${userId}/${file.name}`;
      const { error: storageError } = await supabase.storage
        .from("files")
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      toast({
        title: "File deleted",
        description: file.name,
      });

      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Error deleting file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="group relative rounded-lg border p-4 hover:border-primary"
        >
          <div className="mb-2 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            <span className="font-medium">{file.name}</span>
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
  );
};