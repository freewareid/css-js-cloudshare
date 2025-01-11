import { cn } from "@/lib/utils";

export const EditorLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 text-center">
        <div className="relative h-12 w-12 mx-auto">
          <div className={cn(
            "absolute inset-0 rounded-full border-4 border-primary/20",
            "after:absolute after:inset-0",
            "after:rounded-full after:border-4 after:border-t-primary",
            "after:animate-[spin_0.6s_linear_infinite]"
          )} />
        </div>
        <p className="mt-2 text-sm text-gray-600 animate-pulse">Loading editor...</p>
      </div>
    </div>
  );
};