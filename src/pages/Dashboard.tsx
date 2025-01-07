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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-gray-900">CSS Host</h1>
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <section className="animate-fadeIn">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Upload Files
            </h2>
            <FileUpload userId={session.user.id} />
          </section>

          <section className="animate-fadeIn">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Your Files
            </h2>
            <FileGallery userId={session.user.id} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;