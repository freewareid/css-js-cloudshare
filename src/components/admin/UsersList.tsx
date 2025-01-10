import { Button } from "@/components/ui/button";

type User = {
  id: string;
  email?: string;
  storage_used: number;
  suspended: boolean;
};

type UsersListProps = {
  users: User[];
  onToggleSuspend: (userId: string, currentStatus: boolean) => void;
  formatBytes: (bytes: number) => string;
};

export const UsersList = ({ users, onToggleSuspend, formatBytes }: UsersListProps) => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">User Management</h2>
      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b text-left">User ID</th>
              <th className="px-6 py-3 border-b text-left">Email</th>
              <th className="px-6 py-3 border-b text-left">Storage Used</th>
              <th className="px-6 py-3 border-b text-left">Status</th>
              <th className="px-6 py-3 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4">{user.id}</td>
                <td className="px-6 py-4">{user.email || 'N/A'}</td>
                <td className="px-6 py-4">{formatBytes(user.storage_used)}</td>
                <td className="px-6 py-4">
                  {user.suspended ? 'Suspended' : 'Active'}
                </td>
                <td className="px-6 py-4">
                  <Button
                    variant={user.suspended ? "default" : "destructive"}
                    onClick={() => onToggleSuspend(user.id, user.suspended)}
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
  );
};