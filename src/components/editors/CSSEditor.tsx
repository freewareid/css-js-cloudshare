import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

type CSSEditorProps = {
  fileId: string;
  initialContent: string;
  onClose: () => void;
};

export const CSSEditor = ({ fileId, initialContent, onClose }: CSSEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
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
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[60vh] font-mono text-sm"
          placeholder="Enter your CSS code here..."
        />
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