import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileCardDeleteProps = {
  onDelete: () => void;
};

export const FileCardDelete = ({ onDelete }: FileCardDeleteProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
      onClick={onDelete}
      title="Delete file"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};