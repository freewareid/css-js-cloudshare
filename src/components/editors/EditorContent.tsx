import { ScrollArea } from "@/components/ui/scroll-area";

type EditorContentProps = {
  content: string;
  onChange: (value: string) => void;
};

export const EditorContent = ({ content, onChange }: EditorContentProps) => {
  return (
    <ScrollArea className="h-[70vh]">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full p-4 font-mono text-sm focus:outline-none resize-none"
        style={{
          minHeight: "60vh",
          backgroundColor: "#f8f9fa",
          lineHeight: "1.6",
          tabSize: 2,
        }}
        spellCheck={false}
      />
    </ScrollArea>
  );
};