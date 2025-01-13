import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";

type DashboardContentProps = {
  userId: string;
  onUploadSuccess: () => void;
};

export const DashboardContent = ({ userId, onUploadSuccess }: DashboardContentProps) => {
  return (
    <main className="px-6 py-8 space-y-8">
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Upload Files
        </h2>
        <FileUpload 
          userId={userId} 
          onUploadSuccess={onUploadSuccess}
        />
      </section>

      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Your Files
        </h2>
        <FileGallery 
          userId={userId} 
        />
      </section>
    </main>
  );
};
