import { FileUpload } from "@/components/FileUpload";
import { FileGallery } from "@/components/FileGallery";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container py-8">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">CSS Host</h1>
          <p className="text-lg text-gray-600">
            Simple and fast CSS and JS file hosting
          </p>
        </header>

        <section className="mb-12 animate-fadeIn">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Upload Files
          </h2>
          <FileUpload />
        </section>

        <section className="animate-fadeIn">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Your Files
          </h2>
          <FileGallery />
        </section>
      </div>
    </div>
  );
};

export default Index;