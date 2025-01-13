import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AdminDataProviderProps = {
  children: React.ReactNode;
};

export const useAdminData = () => {
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState<Array<{
    id: string;
    email?: string;
    storage_used: number;
    suspended: boolean;
  }>>([]);
  const [totalStorage, setTotalStorage] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchData = async () => {
    // Fetch all files
    const { data: filesData } = await supabase
      .from('files')
      .select('*');
    setFiles(filesData || []);

    // Fetch all profiles with their storage usage
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*');

    // Get user emails from auth.users through profiles
    const enrichedUsers = await Promise.all((profilesData || []).map(async (profile) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
      
      return {
        ...profile,
        email: user?.email
      };
    }));
    
    setUsers(enrichedUsers);

    // Calculate total storage
    const total = (filesData || []).reduce((acc, file) => acc + (file.size || 0), 0);
    setTotalStorage(total);
  };

  const handleDeleteFile = async (fileId: string) => {
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (error) {
      toast({
        title: "Error deleting file",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "File deleted",
      description: "The file has been successfully deleted",
    });
    fetchData();
  };

  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ suspended: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error updating user status",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "User status updated",
      description: `User has been ${!currentStatus ? 'suspended' : 'unsuspended'}`,
    });
    fetchData();
  };

  return {
    files,
    users,
    totalStorage,
    currentPage,
    setCurrentPage,
    handleDeleteFile,
    handleToggleSuspend,
    fetchData
  };
};

export const AdminDataProvider = ({ children }: AdminDataProviderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || profile.role !== 'superadmin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard",
          variant: "destructive",
        });
        navigate('/dashboard');
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  return <>{children}</>;
};