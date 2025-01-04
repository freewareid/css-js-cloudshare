import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="container max-w-md py-8">
          <header className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">CSS Host</h1>
            <p className="text-lg text-gray-600">
              Simple and fast CSS and JS file hosting
            </p>
          </header>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            providers={[]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <header className="bg-gray-100">
        <div className="container flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-gray-900">CSS Host</h1>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <section className="mb-12 animate-fadeIn">
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
    </div>
  );
};

export default Index;
