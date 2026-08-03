import { useState } from "react";
import {
  useBanUserMutation,
  useTimeoutUserMutation,
} from "../../../store/api/streamApi";

interface SelectedUser {
  id: string;
  name: string;
}

export function useStreamModeration(streamId: string | undefined) {
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [timeoutUser] = useTimeoutUserMutation();
  const [banUser] = useBanUserMutation();

  const selectUser = (user: SelectedUser) => setSelectedUser(user);
  const clearSelectedUser = () => setSelectedUser(null);

  const handleTimeout = async (seconds: number) => {
    if (!selectedUser || !streamId) return;
    await timeoutUser({
      userId: selectedUser.id,
      streamId,
      durationSeconds: seconds,
    }).unwrap();
    setSelectedUser(null);
  };

  const handleBan = async () => {
    if (!selectedUser || !streamId) return;
    await banUser({
      userId: selectedUser.id,
      streamId,
      reason: "Vi phạm nội quy",
    }).unwrap();
    setSelectedUser(null);
  };

  return {
    selectedUser,
    selectUser,
    clearSelectedUser,
    handleTimeout,
    handleBan,
  };
}

export default useStreamModeration;
