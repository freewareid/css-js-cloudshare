import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadSuccess = () => {
    setKey(prev => prev + 1);
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
        toast({
          variant: "destructive",
          title: "Error signing out",
          description: "Please try again later",
        });
      } else {
        navigate('/');
        toast({
          title: "Signed out successfully",
        });
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!currentSession) {
        navigate('/login');
        return;
      }
      setSession(currentSession);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-gray-900">CSS Host</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            disabled={isLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoading ? "Signing out..." : "Sign Out"}
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