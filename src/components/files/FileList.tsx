import { FileCard } from "./FileCard";

export type FileListProps = {
  files: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: "css" | "js";
    created_at: string;
    last_edited_at: string | null;
  }[];
  onDelete: (id: string) => void;
};

export const FileList = ({ files, onDelete }: FileListProps) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <FileCard
          key={file.id}
          {...file}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};