import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileList } from "@/components/files/FileList";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalStorage, setTotalStorage] = useState(0);

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'superadmin') {
      navigate('/dashboard');
    }
  };

  const fetchData = async () => {
    // Fetch all files
    const { data: filesData } = await supabase
      .from('files')
      .select('*');
    setFiles(filesData || []);

    // Fetch all users with their storage usage
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*');
    setUsers(usersData || []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Files</h3>
            <p className="text-2xl">{files.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Users</h3>
            <p className="text-2xl">{users.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Storage Used</h3>
            <p className="text-2xl">{formatBytes(totalStorage)}</p>
          </Card>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="bg-white shadow rounded-lg">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-3 border-b text-left">User ID</th>
                    <th className="px-6 py-3 border-b text-left">Storage Used</th>
                    <th className="px-6 py-3 border-b text-left">Status</th>
                    <th className="px-6 py-3 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">{user.id}</td>
                      <td className="px-6 py-4">{formatBytes(user.storage_used)}</td>
                      <td className="px-6 py-4">
                        {user.suspended ? 'Suspended' : 'Active'}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant={user.suspended ? "default" : "destructive"}
                          onClick={() => handleToggleSuspend(user.id, user.suspended)}
                        >
                          {user.suspended ? 'Unsuspend' : 'Suspend'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">All Files</h2>
            <FileList
              files={files}
              onDelete={handleDeleteFile}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;