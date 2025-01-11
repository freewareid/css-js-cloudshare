import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";

type DashboardContentProps = {
  userId: string;
  onUploadSuccess: () => void;
};

export const DashboardContent = ({ userId, onUploadSuccess }: DashboardContentProps) => {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Upload Files
          </h2>
          <FileUpload 
            userId={userId} 
            onUploadSuccess={onUploadSuccess}
          />
        </section>

        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Your Files
          </h2>
          <FileGallery 
            userId={userId} 
          />
        </section>
      </div>
    </main>
  );
};