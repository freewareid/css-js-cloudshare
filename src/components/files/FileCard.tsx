import { FileCode, Trash2, Copy, Edit, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FileCardProps = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: "css" | "js";
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileCard = ({ id, name, url, size, type, onDelete, onEdit }: FileCardProps) => {
  const { toast } = useToast();
  
  // Transform r2.dev URL to cdn.000.web.id
  const publicUrl = url.replace('r2.dev', 'cdn.000.web.id');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The URL has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const openInNewTab = () => {
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group relative rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <FileCode className="h-5 w-5 text-primary" />
        <span className="font-medium">{name}</span>
      </div>
      <div className="mb-2 text-sm text-gray-500">
        {formatFileSize(size)}
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={publicUrl}
          className="w-full rounded-md bg-gray-50 px-3 py-1 text-sm"
        />
        <button
          onClick={() => copyToClipboard(publicUrl)}
          className="rounded-md p-2 hover:bg-gray-100"
          title="Copy URL"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={openInNewTab}
          className="rounded-md p-2 hover:bg-gray-100"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute right-2 top-2 hidden space-x-1 group-hover:flex">
        {type === 'css' && (
          <button
            onClick={() => onEdit(id)}
            className="rounded-md p-1 text-blue-500 hover:bg-blue-50"
            title="Edit CSS"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(id)}
          className="rounded-md p-1 text-red-500 hover:bg-red-50"
          title="Delete file"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};