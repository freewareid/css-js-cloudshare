import { format } from "date-fns";

type FileCardMetadataProps = {
  created_at: string;
  last_edited_at: string | null;
};

export const FileCardMetadata = ({ created_at, last_edited_at }: FileCardMetadataProps) => {
  return (
    <div className="mt-2 flex gap-4 text-xs text-gray-500">
      <span>Uploaded: {format(new Date(created_at), 'MMM d, yyyy HH:mm')}</span>
      {last_edited_at && (
        <span>Last edited: {format(new Date(last_edited_at), 'MMM d, yyyy HH:mm')}</span>
      )}
    </div>
  );
};