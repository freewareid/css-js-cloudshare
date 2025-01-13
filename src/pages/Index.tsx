import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { FileList } from "@/components/files/FileList";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-white">
      <header className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-medium text-gray-900">CSS Host</h1>
          {session ? (
            <div className="space-x-4">
              <Button 
                variant="ghost" 
                className="text-sm font-medium"
                asChild
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => supabase.auth.signOut()}
                className="text-sm font-medium"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost"
              className="text-sm font-medium"
              asChild
            >
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24 sm:py-32">
          <div className="absolute inset-0 bg-[url(/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          <div className="relative mx-auto max-w-[1440px] px-6">
            <div className="max-w-2xl">
              <h2 className="text-6xl font-semibold tracking-tight text-gray-900 mb-6">
                Share CSS & JS files.
                <br />
                Effortlessly.
              </h2>
              <p className="text-xl text-gray-600 mb-12">
                Upload and share your CSS and JS files instantly. No registration required.
                Get started with our powerful file hosting platform.
              </p>
              {!session && (
                <Button 
                  size="lg" 
                  className="h-12 px-6 text-base"
                  asChild
                >
                  <Link to="/login">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="grid gap-12 md:grid-cols-3 mb-16">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Free Upload</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share files without creating an account. Quick and easy file sharing for everyone.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">File Limits</h3>
                <p className="text-gray-600 leading-relaxed">
                  Maximum file size of 1MB per upload. Perfect for CSS and JS files.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Auto Cleanup</h3>
                <p className="text-gray-600 leading-relaxed">
                  Files are automatically deleted after 30 days to keep the platform clean.
                </p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <FileUpload userId="00000000-0000-0000-0000-000000000000" />
            </div>
          </div>
        </section>

        {files.length > 0 && (
          <section className="py-24 bg-gray-50">
            <div className="max-w-[1440px] mx-auto px-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">Recent Uploads</h2>
              <FileList 
                files={files} 
                onDelete={() => {}} 
              />
            </div>
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} CSS Host. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;