import { Copy, ExternalLink, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type FileCardActionsProps = {
  url: string;
  type: "css" | "js";
  onEdit: () => void;
  isLoading: boolean;
};

export const FileCardActions = ({ url, type, onEdit, isLoading }: FileCardActionsProps) => {
  const { toast } = useToast();
  const publicUrl = url.replace('pub-c7fe5d7345b64a8aa90756d140154223.r2.dev', 'cdn.000.web.id');

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
    <div className="mt-1 flex items-center gap-2">
      <input
        readOnly
        value={publicUrl}
        className="flex-1 truncate rounded-md bg-gray-50 px-2 py-1 text-sm"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => copyToClipboard(publicUrl)}
        title="Copy URL"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
        title="Open in new tab"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
      {type === "css" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          disabled={isLoading}
          title="Edit file"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Edit className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};