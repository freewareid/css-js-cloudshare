import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [key, setKey] = useState(0); // Add this for forcing re-render

  const handleUploadSuccess = () => {
    setKey(prev => prev + 1); // This will force a re-render of FileGallery
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
        return;
      }
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        navigate('/');
        toast({
          title: "Signed out successfully",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-gray-900">CSS Host</h1>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Upload Files
            </h2>
            <FileUpload 
              userId={session.user.id} 
              onUploadSuccess={handleUploadSuccess}
            />
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Your Files
            </h2>
            <FileGallery 
              key={key} 
              userId={session.user.id} 
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;