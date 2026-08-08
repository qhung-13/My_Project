import { useEffect, useId, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useUpdateProfileMutation } from "../../store/api/userApi";
import type { AppDispatch } from "../../store/store";
import { setUser } from "../../store/slices/authSlice";
import "./EditProfile.css";

interface Profile {
  username?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  avatar?: string | null;
  bannerImage?: string | null;
}

interface EditProfileProps {
  profile: Profile;
  onClose: () => void;
}

const isValidOptionalHttpUrl = (value: string) => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const EditProfile = ({ profile, onClose }: EditProfileProps) => {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cardRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isValidOptionalHttpUrl(avatar)) {
      setError("Avatar must be a valid HTTP or HTTPS URL");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError("New password must contain at least 8 characters");
      return;
    }

    try {
      const response = await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        ...(newPassword && { currentPassword, password: newPassword }),
      }).unwrap();

      dispatch(
        setUser({
          _id: response._id,
          username: response.username,
          email: response.email,
          displayName: response.displayName,
          bio: response.bio,
          avatar: response.avatar || null,
          bannerImage: response.bannerImage || null,
          coins: response.coins ?? 0,
          role: response.role || "user",
        }),
      );

      onClose();
    } catch (requestError) {
      const apiError = requestError as { data?: { message?: string } };
      setError(apiError.data?.message || "Update failed");
    }
  };

  const initials = (profile.username || "U").slice(0, 2).toUpperCase();

  return (
    <div className="edit-profile" role="presentation">
      <button
        className="edit-profile__overlay"
        type="button"
        aria-label="Close edit profile dialog"
        disabled={isLoading}
        onClick={onClose}
      />

      <div
        ref={cardRef}
        className="edit-profile__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button
          className="edit-profile__close"
          type="button"
          aria-label="Close"
          disabled={isLoading}
          onClick={onClose}
        >
          &times;
        </button>

        <div className="edit-profile__heading">
          <h2 id={titleId} className="edit-profile__title">
            Edit profile
          </h2>
          <p>Update how your channel appears to viewers.</p>
        </div>

        {error && (
          <p className="edit-profile__error" role="alert">
            {error}
          </p>
        )}

        <form className="edit-profile__form" onSubmit={handleSubmit} noValidate>
          <div className="edit-profile__field">
            <label
              className="edit-profile__label"
              htmlFor="edit-profile-avatar"
            >
              Avatar URL
            </label>
            <div className="edit-profile__avatar-preview">
              {avatar && isValidOptionalHttpUrl(avatar) ? (
                <img
                  src={avatar}
                  alt="Avatar preview"
                  className="edit-profile__avatar-img"
                />
              ) : (
                <div
                  className="edit-profile__avatar-placeholder"
                  aria-hidden="true"
                >
                  {initials}
                </div>
              )}
            </div>
            <input
              id="edit-profile-avatar"
              type="url"
              inputMode="url"
              placeholder="https://example.com/avatar.jpg"
              className="edit-profile__input"
              value={avatar}
              maxLength={2048}
              onChange={(event) => setAvatar(event.target.value)}
            />
          </div>

          <div className="edit-profile__field">
            <label
              className="edit-profile__label"
              htmlFor="edit-profile-display-name"
            >
              Display name
            </label>
            <input
              id="edit-profile-display-name"
              type="text"
              className="edit-profile__input"
              value={displayName}
              maxLength={50}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>

          <div className="edit-profile__field">
            <label className="edit-profile__label" htmlFor="edit-profile-bio">
              <span>Bio</span>
              <span className="edit-profile__count">{bio.length}/200</span>
            </label>
            <textarea
              id="edit-profile-bio"
              className="edit-profile__textarea"
              value={bio}
              maxLength={200}
              rows={4}
              onChange={(event) => setBio(event.target.value)}
            />
          </div>

          <div className="edit-profile__account-note">
            <strong>Account email</strong>
            <span>{profile.email || "Not available"}</span>
            <small>
              Email changes require a dedicated verification flow and are not
              edited here.
            </small>
          </div>

          <fieldset className="edit-profile__password-group">
            <legend>Change password</legend>
            <p>Leave both fields empty to keep your current password.</p>

            <div className="edit-profile__field">
              <label
                className="edit-profile__label"
                htmlFor="edit-profile-current-password"
              >
                Current password
              </label>
              <input
                id="edit-profile-current-password"
                type="password"
                autoComplete="current-password"
                className="edit-profile__input"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>

            <div className="edit-profile__field">
              <label
                className="edit-profile__label"
                htmlFor="edit-profile-new-password"
              >
                New password
              </label>
              <input
                id="edit-profile-new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="edit-profile__input"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
          </fieldset>

          <div className="edit-profile__actions">
            <button
              type="button"
              className="edit-profile__btn edit-profile__btn--cancel"
              disabled={isLoading}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-profile__btn edit-profile__btn--save"
              disabled={isLoading}
            >
              {isLoading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
