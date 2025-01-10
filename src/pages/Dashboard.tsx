import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        // If no active session, clear local state and redirect
        setSession(null);
        navigate('/login');
        toast({
          title: "Session expired",
          description: "Please log in again",
        });
        return;
      }

      // Attempt to sign out with local scope
      const { error } = await supabase.auth.signOut({
        scope: 'local'
      });

      if (error) {
        console.error("Error signing out:", error.message);
        
        // If session not found, clear local state
        if (error.message.includes("session_not_found")) {
          setSession(null);
          navigate('/login');
          toast({
            title: "Session expired",
            description: "Please log in again",
          });
          return;
        }

        // For other errors
        toast({
          variant: "destructive",
          title: "Error signing out",
          description: error.message,
        });
      } else {
        navigate('/login');
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
    let mounted = true;

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (mounted) {
            navigate('/login');
          }
          return;
        }

        if (!currentSession && mounted) {
          navigate('/login');
          return;
        }

        if (mounted) {
          setSession(currentSession);
          
          // Check user role and redirect if necessary
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();

          if (profile?.role === 'superadmin') {
            navigate('/admin');
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) {
          navigate('/login');
        }
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      if (newSession) {
        setSession(newSession);
        
        // Check role on auth state change
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', newSession.user.id)
          .single();

        if (profile?.role === 'superadmin') {
          navigate('/admin');
        }
      } else {
        setSession(null);
        navigate('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-gray-900">CSS Host</h1>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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