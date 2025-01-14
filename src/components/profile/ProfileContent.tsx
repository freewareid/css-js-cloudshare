import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ProfileContentProps = {
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onPasswordChange: () => void;
  onDeleteAccount: () => void;
};

export const ProfileContent = ({
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onPasswordChange,
  onDeleteAccount,
}: ProfileContentProps) => {
  return (
    <main className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={onPasswordChange}>Update Password</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Delete Account</h2>
        <p className="text-gray-600 mb-4">
          Warning: This action cannot be undone. All your files and data will be permanently deleted.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your files from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDeleteAccount}>
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </main>
  );
};