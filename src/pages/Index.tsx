import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
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
      if (_event === 'SIGNED_IN') {
        toast({
          title: "Successfully signed in",
          description: "Welcome back!",
        });
      } else if (_event === 'SIGNED_OUT') {
        toast({
          title: "Signed out successfully",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

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
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4F46E5',
                    brandAccent: '#6366F1',
                  },
                },
              },
            }}
            theme="light"
            providers={[]}
            localization={{
              variables: {
                sign_up: {
                  password_label: 'Password (minimum 6 characters)',
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

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

export default Index;