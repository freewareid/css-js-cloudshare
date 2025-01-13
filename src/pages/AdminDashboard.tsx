import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatsCards } from "@/components/admin/StatsCards";
import { UsersList } from "@/components/admin/UsersList";
import { FilesList } from "@/components/admin/FilesList";
import { AdminDataProvider, useAdminData } from "@/components/admin/AdminDataProvider";

const ITEMS_PER_PAGE = 10;

const AdminDashboardContent = () => {
  const {
    files,
    users,
    totalStorage,
    currentPage,
    setCurrentPage,
    handleDeleteFile,
    handleToggleSuspend,
  } = useAdminData();

  // Pagination calculations
  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFiles = files.slice(startIndex, endIndex);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

const AdminDashboard = () => {
  return (
    <AdminDataProvider>
      <AdminDashboardContent />
    </AdminDataProvider>
  );
};

export default AdminDashboard;