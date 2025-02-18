import { Loader2 } from "lucide-react";

export const EditorLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-gray-600">Loading editor...</p>
      </div>
    </div>
  );
};