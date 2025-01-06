import { Progress } from "@/components/ui/progress";

type StorageUsageProps = {
  used: number;
  total: number;
  fileCount: number;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const StorageUsage = ({ used, total, fileCount }: StorageUsageProps) => {
  const storageUsedPercentage = (used / total) * 100;

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Storage Usage</h3>
        <p className="text-sm text-gray-500">
          {fileCount} file{fileCount !== 1 ? 's' : ''} stored
        </p>
      </div>
      
      <div className="space-y-2">
        <Progress value={storageUsedPercentage} className="h-2" />
        <div className="flex justify-between text-sm text-gray-600">
          <span>{formatFileSize(used)} used</span>
          <span>{formatFileSize(total - used)} available</span>
        </div>
      </div>
    </div>
  );
};