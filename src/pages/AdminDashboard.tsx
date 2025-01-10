import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatsCards } from "@/components/admin/StatsCards";
import { UsersList } from "@/components/admin/UsersList";
import { FilesList } from "@/components/admin/FilesList";

const ITEMS_PER_PAGE = 10;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState<Array<{
    id: string;
    email?: string;
    storage_used: number;
    suspended: boolean;
  }>>([]);
  const [totalStorage, setTotalStorage] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Pagination calculations
  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFiles = files.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="max-w-7xl mx-auto py-6 px-4">
        <StatsCards
          filesCount={files.length}
          usersCount={users.length}
          totalStorage={totalStorage}
        />
        <div className="space-y-6">
          <UsersList
            users={users}
            onToggleSuspend={handleToggleSuspend}
            formatBytes={formatBytes}
          />
          <FilesList
            files={paginatedFiles}
            onDelete={handleDeleteFile}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;