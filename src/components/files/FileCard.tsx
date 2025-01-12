import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NotePadEditor } from "../editors/NotePadEditor";
import { FileCardHeader } from "./FileCardHeader";
import { FileCardActions } from "./FileCardActions";
import { FileCardMetadata } from "./FileCardMetadata";
import { FileCardDelete } from "./FileCardDelete";

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

  const handleEdit = async () => {
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
  };

  return (
    <>
      <div className="group relative flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex-1">
          <FileCardHeader name={name} size={size} />
          <FileCardActions 
            url={url} 
            type={type} 
            onEdit={handleEdit}
            isLoading={isLoading}
          />
          <FileCardMetadata 
            created_at={created_at}
            last_edited_at={last_edited_at}
          />
        </div>
        <FileCardDelete onDelete={() => onDelete(id)} />
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