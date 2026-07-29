import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/authSlice";
import { useGetProfileQuery } from "../../store/api/userApi";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
    }
  }, [token]);

  const { data: profile } = useGetProfileQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (profile) {
      dispatch(
        setUser({
          _id: profile._id,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar,
          coins: profile.coins || 0,
          role: profile.role || "user",
        }),
      );
      navigate("/home");
    }
  }, [profile, dispatch, navigate]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <p>Đang đăng nhập...</p>
    </div>
  );
};

export default AuthCallback;
