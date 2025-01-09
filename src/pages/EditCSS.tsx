import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileEditor } from "@/components/editors/FileEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const EditCSS = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFileContent = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: fileData, error: fileError } = await supabase
          .from("files")
          .select("*")
          .eq("id", fileId)
          .eq("user_id", user.id)
          .single();

        if (fileError || !fileData) {
          toast({
            title: "Error loading file",
            description: "File not found or access denied",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        setFileName(fileData.name);

        const { data, error } = await supabase.functions.invoke('get-file-content', {
          body: { fileId }
        });

        if (error) throw error;
        setFileContent(data.content);
      } catch (error: any) {
        toast({
          title: "Error loading file",
          description: error.message,
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();
  }, [fileId, navigate, toast]);

  const handleClose = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Editing {fileName}
            </h1>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow">
            <FileEditor
              fileId={fileId!}
              initialContent={fileContent}
              fileType="css"
              onClose={handleClose}
            />
          </div>
        </main>
      </ScrollArea>
    </div>
  );
};

export default EditCSS;