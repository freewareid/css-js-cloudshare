import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfileHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium text-gray-900">Profile Settings</h1>
        </div>
      </div>
    </header>
  );
};