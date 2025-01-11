import { useState, useCallback } from "react";
import { FileCode, Trash2, Copy, ExternalLink, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { NotePadEditor } from "../editors/NotePadEditor";
import { supabase } from "@/integrations/supabase/client";
import { formatFileSize } from "@/utils/fileUtils";
import { format } from "date-fns";

type FileCardProps = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: "css" | "js";
  created_at: string;
  last_edited_at: string | null;
  onDelete: (id: string) => void;
};

export const FileCard = ({ 
  id, 
  name, 
  url, 
  size, 
  type, 
  created_at,
  last_edited_at,
  onDelete 
}: FileCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const publicUrl = url.replace('pub-c7fe5d7345b64a8aa90756d140154223.r2.dev', 'cdn.000.web.id');

  const copyToClipboard = useCallback(async (text: string) => {
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
  }, [toast]);

  const handleEdit = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('get-file-content', {
        body: { fileId: id }
      });

      if (error) throw error;
      
      setFileContent(data.content);
      setIsEditing(true);
    } catch (error: any) {
      toast({
        title: "Error loading file",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  return (
    <>
      <div className="group relative flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-4 flex-1">
          <FileCode className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{name}</span>
              <span className="text-xs text-gray-500">
                {formatFileSize(size)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input
                readOnly
                value={publicUrl}
                className="flex-1 truncate rounded-md bg-gray-50 px-2 py-1 text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(publicUrl)}
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              {type === "css" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleEdit}
                  disabled={isLoading}
                  title="Edit file"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>Uploaded: {format(new Date(created_at), 'MMM d, yyyy HH:mm')}</span>
              {last_edited_at && (
                <span>Last edited: {format(new Date(last_edited_at), 'MMM d, yyyy HH:mm')}</span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(id)}
          title="Delete file"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {isEditing && (
        <NotePadEditor
          fileId={id}
          initialContent={fileContent}
          onClose={() => {
            setIsEditing(false);
            setFileContent("");
          }}
        />
      )}
    </>
  );
};