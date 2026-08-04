import {
  useGetStatsQuery,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useToggleBanUserMutation,
  useGetAllVideosQuery,
  useDeleteVideoMutation,
  useGetAllStreamsQuery,
} from "../../../store/api/adminApi";
import type {
  AdminUser,
  AdminVideo,
  AdminStream,
  AdminStats,
} from "../../../types/index";

/**
 * Owns every admin data query + mutation. Admin.tsx only decides which tab
 * (and therefore which slice of this data) to render.
 */
export function useAdminData() {
  const { data: stats } = useGetStatsQuery(undefined) as {
    data: AdminStats | undefined;
  };
  const { data: users } = useGetAllUsersQuery(undefined) as {
    data: AdminUser[] | undefined;
  };
  const { data: videos } = useGetAllVideosQuery(undefined) as {
    data: AdminVideo[] | undefined;
  };
  const { data: streams } = useGetAllStreamsQuery(undefined) as {
    data: AdminStream[] | undefined;
  };

  const [updateUserRole] = useUpdateUserRoleMutation();
  const [toggleBanUser] = useToggleBanUserMutation();
  const [deleteVideo] = useDeleteVideoMutation();

  const handleRoleChange = async (id: string, role: string) => {
    await updateUserRole({ id, role }).unwrap();
  };

  const handleBan = async (id: string) => {
    await toggleBanUser(id).unwrap();
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Xóa video này?")) return;
    await deleteVideo(id).unwrap();
  };

  return {
    stats,
    users,
    videos,
    streams,
    handleRoleChange,
    handleBan,
    handleDeleteVideo,
  };
}

export default useAdminData;
