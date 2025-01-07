import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <header className="bg-white/80 backdrop-blur-sm fixed w-full z-10 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-gray-900">CSS Host</h1>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8">
        <section className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Quick CSS & JS File Sharing
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Upload and share your CSS and JS files instantly. No registration required.
          </p>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Free Upload</h3>
              <p className="text-gray-600">Share files without creating an account</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">File Limits</h3>
              <p className="text-gray-600">Maximum file size of 1MB per upload</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Auto Cleanup</h3>
              <p className="text-gray-600">Files are automatically deleted after 30 days</p>
            </div>
          </div>
        </section>

        <section className="max-w-2xl mx-auto">
          <FileUpload userId="anonymous" />
        </section>
      </main>
    </div>
  );
};

export default Index;