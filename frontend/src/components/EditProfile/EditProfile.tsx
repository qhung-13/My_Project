import { useState } from "react";
import { useUpdateProfileMutation } from "../../store/api/userApi";
import "./EditProfile.css";

interface Profile {
  username?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  avatar?: string | null;
}

interface EditProfileProps {
  profile: Profile;
  onClose: () => void;
}

const EditProfile = ({ profile, onClose }: EditProfileProps) => {
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await updateProfile({
        displayName,
        bio,
        avatar,
        email,
        ...(newPassword && { currentPassword, password: newPassword }),
      }).unwrap();
      onClose();
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || "Update failed");
    }
  };

  return (
    <div className="edit-profile">
      <div className="edit-profile__overlay" onClick={onClose} />

      <div className="edit-profile__card">
        <button className="edit-profile__close" onClick={onClose}>
          &times;
        </button>

        <h2 className="edit-profile__title">Edit Profile</h2>

        {error && <p className="edit-profile__error">{error}</p>}

        <form className="edit-profile__form" onSubmit={handleSubmit}>
          {/* Avatar */}
          <div className="edit-profile__field">
            <label className="edit-profile__label">Avatar URL</label>
            <div className="edit-profile__avatar-preview">
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="edit-profile__avatar-img"
                />
              ) : (
                <div className="edit-profile__avatar-placeholder">
                  {profile?.username?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Nhập URL ảnh..."
              className="edit-profile__input"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>

          {/* Display Name */}
          <div className="edit-profile__field">
            <label className="edit-profile__label">Display Name</label>
            <input
              type="text"
              placeholder="Tên hiển thị..."
              className="edit-profile__input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="edit-profile__field">
            <label className="edit-profile__label">
              Bio <span className="edit-profile__count">{bio.length}/200</span>
            </label>
            <textarea
              placeholder="Giới thiệu bản thân..."
              className="edit-profile__textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={4}
            />
          </div>

          {/* Email */}
          <div className="edit-profile__field">
            <label className="edit-profile__label">Email</label>
            <input
              type="email"
              placeholder="Email..."
              className="edit-profile__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="edit-profile__field">
            <label className="edit-profile__label">Mật khẩu hiện tại</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu hiện tại..."
              className="edit-profile__input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="edit-profile__field">
            <label className="edit-profile__label">Mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới..."
              className="edit-profile__input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="edit-profile__actions">
            <button
              type="button"
              className="edit-profile__btn edit-profile__btn--cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-profile__btn edit-profile__btn--save"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
