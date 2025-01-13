import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkUserProfile = useCallback(async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile;
  }, []);

  const handleAuthChange = useCallback(async (session: any) => {
    if (!session) return;

    const profile = await checkUserProfile(session.user.id);
    if (!profile) return;

    if (profile.role === 'superadmin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  }, [navigate, checkUserProfile]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await handleAuthChange(session);

        if (event === 'SIGNED_IN') {
          toast({
            title: "Successfully signed in",
            description: "Welcome back!",
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [handleAuthChange, toast]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
        <header className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">CSS Host</h1>
          <p className="text-lg text-gray-600">
            Simple and fast CSS and JS file hosting
          </p>
        </header>
        <AuthForm />
      </div>
    </div>
  );
};

export default Login;