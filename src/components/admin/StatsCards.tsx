import { Card } from "@/components/ui/card";

type StatsCardsProps = {
  filesCount: number;
  usersCount: number;
  totalStorage: number;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const StatsCards = ({ filesCount, usersCount, totalStorage }: StatsCardsProps) => {
  return (
    <div className="grid gap-6 mb-8 md:grid-cols-3">
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Total Files</h3>
        <p className="text-2xl">{filesCount}</p>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Total Users</h3>
        <p className="text-2xl">{usersCount}</p>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Total Storage Used</h3>
        <p className="text-2xl">{formatBytes(totalStorage)}</p>
      </Card>
    </div>
  );
};