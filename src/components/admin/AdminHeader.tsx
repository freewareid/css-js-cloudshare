import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const AdminHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut({
        scope: 'local'
      });

      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      navigate('/login');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </header>
  );
};