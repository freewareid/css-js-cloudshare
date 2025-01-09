import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { FileList } from "@/components/files/FileList";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [files, setFiles] = useState([]);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  const fetchAnonymousFiles = async () => {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', '00000000-0000-0000-0000-000000000000')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFiles(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchAnonymousFiles();

    window.addEventListener('fileUploaded', fetchAnonymousFiles);
    return () => {
      window.removeEventListener('fileUploaded', fetchAnonymousFiles);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <header className="bg-white/80 backdrop-blur-sm fixed w-full z-10 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-gray-900">CSS Host</h1>
          {session ? (
            <div className="space-x-4">
              <Button asChild variant="outline">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => supabase.auth.signOut()}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
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

        <section className="max-w-2xl mx-auto mb-12">
          <FileUpload userId="00000000-0000-0000-0000-000000000000" />
        </section>

        {files.length > 0 && (
          <section className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Uploads</h2>
            <FileList 
              files={files} 
              onDelete={() => {}} 
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;