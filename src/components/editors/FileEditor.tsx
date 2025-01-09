import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

type FileEditorProps = {
  fileId: string;
  initialContent: string;
  fileType: "css" | "js";
  onClose: () => void;
};

export const FileEditor = ({ fileId, initialContent, fileType, onClose }: FileEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
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

      toast({
        title: "Changes saved",
        description: "Your file has been updated successfully",
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const editorOptions = {
    lineWrapping: false,
    mode: fileType,
    toolbar: false,
    status: false,
    spellChecker: false,
    minHeight: "60vh",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Edit {fileType.toUpperCase()} File</h2>
        <div className="mb-4">
          <div className="max-w-[720px] mx-auto">
            <SimpleMDE
              value={content}
              onChange={setContent}
              options={editorOptions}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};