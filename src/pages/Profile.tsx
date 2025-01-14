import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileContent } from "@/components/profile/ProfileContent";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Password updated successfully",
    });
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Delete all user's files
    const { error: filesError } = await supabase
      .from('files')
      .delete()
      .eq('user_id', session.user.id);

    if (filesError) {
      toast({
        title: "Error deleting files",
        description: filesError.message,
        variant: "destructive",
      });
      return;
    }

    // Delete user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', session.user.id);

    if (profileError) {
      toast({
        title: "Error deleting profile",
        description: profileError.message,
        variant: "destructive",
      });
      return;
    }

    // Sign out and redirect to home
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader />
      <ProfileContent
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onPasswordChange={handlePasswordChange}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
};

export default Profile;