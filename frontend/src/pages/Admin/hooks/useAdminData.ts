import { useState } from "react";
import {
  useDeleteVideoMutation,
  useGetAllStreamsQuery,
  useGetAllUsersQuery,
  useGetAllVideosQuery,
  useGetStatsQuery,
  useToggleBanUserMutation,
  useUpdateUserRoleMutation,
} from "../../../store/api/adminApi";

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string }; error?: string };
  return apiError.data?.message || apiError.error || fallback;
};

export function useAdminData() {
  const statsQuery = useGetStatsQuery();
  const usersQuery = useGetAllUsersQuery();
  const videosQuery = useGetAllVideosQuery();
  const streamsQuery = useGetAllStreamsQuery();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [toggleBanUser] = useToggleBanUserMutation();
  const [deleteVideo] = useDeleteVideoMutation();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const runAction = async (
    actionKey: string,
    action: () => Promise<unknown>,
    fallbackMessage: string,
  ) => {
    setPendingAction(actionKey);
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(getErrorMessage(error, fallbackMessage));
    } finally {
      setPendingAction(null);
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    await runAction(
      `role:${id}`,
      () => updateUserRole({ id, role }).unwrap(),
      "Không thể cập nhật quyền người dùng.",
    );
  };

  const handleBan = async (id: string) => {
    await runAction(
      `ban:${id}`,
      () => toggleBanUser(id).unwrap(),
      "Không thể cập nhật trạng thái tài khoản.",
    );
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa video này?")) return;
    await runAction(
      `delete:${id}`,
      () => deleteVideo(id).unwrap(),
      "Không thể xóa video.",
    );
  };

  return {
    stats: statsQuery.data,
    users: usersQuery.data,
    videos: videosQuery.data,
    streams: streamsQuery.data,
    isLoading:
      statsQuery.isLoading ||
      usersQuery.isLoading ||
      videosQuery.isLoading ||
      streamsQuery.isLoading,
    queryError:
      statsQuery.isError ||
      usersQuery.isError ||
      videosQuery.isError ||
      streamsQuery.isError,
    actionError,
    pendingAction,
    refetchAll: () => {
      void statsQuery.refetch();
      void usersQuery.refetch();
      void videosQuery.refetch();
      void streamsQuery.refetch();
    },
    handleRoleChange,
    handleBan,
    handleDeleteVideo,
  };
}

export default useAdminData;
