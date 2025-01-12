import { FileCode } from "lucide-react";
import { formatFileSize } from "@/utils/fileUtils";

type FileCardHeaderProps = {
  name: string;
  size: number;
};

export const FileCardHeader = ({ name, size }: FileCardHeaderProps) => {
  return (
    <div className="flex items-center gap-4">
      <FileCode className="h-5 w-5 text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{name}</span>
          <span className="text-xs text-gray-500">
            {formatFileSize(size)}
          </span>
        </div>
      </div>
    </div>
  );
};