import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        checkUserRole(session.user.id);
      }
      if (_event === 'SIGNED_IN') {
        toast({
          title: "Successfully signed in",
          description: "Welcome back!",
        });
      }
      if (_event === 'USER_UPDATED' || _event === 'SIGNED_OUT') {
        setErrorMessage(""); // Clear errors on sign out or user update
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const getErrorMessage = (error: AuthError) => {
    if (error instanceof AuthApiError) {
      switch (error.status) {
        case 400:
          return 'Invalid email or password. Please check your credentials and try again.';
        case 422:
          return 'Invalid email format. Please enter a valid email address.';
        case 429:
          return 'Too many login attempts. Please try again later.';
        default:
          return error.message;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const checkUserRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        toast({
          title: "Error",
          description: "There was an error checking your access level",
          variant: "destructive",
        });
        return;
      }

      if (profile?.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container max-w-md py-8">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">CSS Host</h1>
          <p className="text-lg text-gray-600">
            Simple and fast CSS and JS file hosting
          </p>
        </header>
        {errorMessage && (
          <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 rounded-md">
            {errorMessage}
          </div>
        )}
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
        />
      </div>
    </div>
  );
};

export default Login;