import { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../utils/axios";

const UploadVideo = () => {
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("LOL");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!videoFile || !title || !description || !category) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Upload video
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("tags", tags);
      formData.append("duration", "0");
      formData.append("type", "clip");

      const res = await instance.post("/videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const videoId = res.data._id;

      // Step 2: Upload thumbnail if have
      if (thumbnail && videoId) {
        const thumbFormData = new FormData();
        thumbFormData.append("thumbnail", thumbnail);
        thumbFormData.append("status", "public");

        await instance.put(`/videos/${videoId}`, thumbFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate("/profile/me");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p>{error}</p>}

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
      />

      <div>
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="LOL">LOL</option>
          <option value="PUBG">PUBG</option>
        </select>
      </div>

      <div>
        <label>Tags</label>
        <input
          type="text"
          placeholder="gaming, lol, ..."
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div>
        <label>Thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
};

export default UploadVideo;
