import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [key, setKey] = useState(0);

  const handleUploadSuccess = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    let mounted = true;

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      if (newSession) {
        setSession(newSession);
        
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
  }, [navigate, toast]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />
      <div className="max-w-[1440px] mx-auto">
        <DashboardContent 
          userId={session.user.id}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    </div>
  );
};

export default Dashboard;