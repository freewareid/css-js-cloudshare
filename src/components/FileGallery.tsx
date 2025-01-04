import { FileCode, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type File = {
  id: string;
  name: string;
  url: string;
  type: "css" | "js";
};

const demoFiles: File[] = [
  {
    id: "1",
    name: "styles.css",
    url: "https://is3.cloudhost.id/demo/styles.css",
    type: "css",
  },
  {
    id: "2",
    name: "script.js",
    url: "https://is3.cloudhost.id/demo/script.js",
    type: "js",
  },
];

export const FileGallery = () => {
  const { toast } = useToast();

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {demoFiles.map((file) => (
        <div
          key={file.id}
          className="group relative rounded-lg border p-4 hover:border-primary"
        >
          <div className="mb-2 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            <span className="font-medium">{file.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={file.url}
              className="w-full rounded-md bg-gray-50 px-3 py-1 text-sm"
            />
            <button
              onClick={() => copyToClipboard(file.url)}
              className="rounded-md p-2 hover:bg-gray-100"
              title="Copy URL"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <button
            className="absolute right-2 top-2 hidden rounded-md p-1 text-red-500 hover:bg-red-50 group-hover:block"
            title="Delete file"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};