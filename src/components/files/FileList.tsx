import { FileCard } from "./FileCard";

type File = {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: "css" | "js";
  size: number;
  created_at: string;
};

type FileListProps = {
  files: File[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

export const FileList = ({ files, onDelete, onEdit }: FileListProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => (
        <FileCard
          key={file.id}
          id={file.id}
          name={file.name}
          url={file.url}
          size={file.size}
          type={file.type}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};