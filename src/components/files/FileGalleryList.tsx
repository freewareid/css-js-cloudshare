import { FileList } from "./FileList";

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

type FileGalleryListProps = {
  files: File[];
  onDelete: (id: string) => void;
};

export const FileGalleryList = ({ files, onDelete }: FileGalleryListProps) => {
  return (
    <div className="space-y-6">
      <FileList
        files={files}
        onDelete={onDelete}
      />
    </div>
  );
};