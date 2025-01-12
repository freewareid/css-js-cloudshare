import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EditorLoader } from "../loaders/EditorLoader";
import { EditorHeader } from "./EditorHeader";
import { EditorContent } from "./EditorContent";

type NotePadEditorProps = {
  fileId: string;
  initialContent: string;
  onClose: () => void;
};

export const NotePadEditor = ({ fileId, initialContent, onClose }: NotePadEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: uploadError } = await supabase.functions.invoke('update-file-content', {
        body: { 
          fileId, 
          content,
          userId: user.id
        }
      });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('files')
        .update({ last_edited_at: new Date().toISOString() })
        .eq('id', fileId);

      if (updateError) throw updateError;

      toast({
        title: "Changes saved",
        description: "Your file has been updated successfully",
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error saving file:', error);
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  }, [content, fileId, onClose, toast]);

  if (isLoading) {
    return <EditorLoader />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl">
        <EditorHeader 
          isSaving={isSaving}
          onClose={onClose}
          onSave={handleSave}
        />
        <EditorContent 
          content={content}
          onChange={setContent}
        />
      </div>
    </div>
  );
};