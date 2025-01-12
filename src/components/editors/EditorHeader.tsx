import { Button } from "@/components/ui/button";

type EditorHeaderProps = {
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
};

export const EditorHeader = ({ isSaving, onClose, onSave }: EditorHeaderProps) => {
  return (
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
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};