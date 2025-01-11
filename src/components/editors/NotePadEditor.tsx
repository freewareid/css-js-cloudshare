import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditorLoader } from "../loaders/EditorLoader";

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
      
      const { error: uploadError } = await supabase.functions.invoke('update-css-file', {
        body: { fileId, content }
      });

      if (uploadError) throw uploadError;

      toast({
        title: "Changes saved",
        description: "Your CSS file has been updated successfully",
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
      setIsLoading(false);
    }
  }, [content, fileId, onClose, toast]);

  if (isLoading) {
    return <EditorLoader />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Edit CSS File</h2>
          <div className="flex gap-2">
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
        <ScrollArea className="h-[70vh]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm focus:outline-none resize-none"
            style={{
              minHeight: "60vh",
              backgroundColor: "#f8f9fa",
              lineHeight: "1.6",
              tabSize: 2,
            }}
            spellCheck={false}
          />
        </ScrollArea>
      </div>
    </div>
  );
};