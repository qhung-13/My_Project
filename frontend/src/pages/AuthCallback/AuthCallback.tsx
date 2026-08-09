import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/authSlice";
import { useGetProfileQuery } from "../../store/api/userApi";
import type { AppDispatch } from "../../store/store";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const authFailed = searchParams.get("status") === "failed";

  // OAuth now uses the same httpOnly JWT cookie as password login. There is
  // intentionally no token in the URL/localStorage; the browser sends the
  // cookie automatically because userApi uses credentials: "include".
  const {
    data: profile,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetProfileQuery(undefined, {
    skip: authFailed,
  });

  useEffect(() => {
    if (!profile) return;

    dispatch(
      setUser({
        ...profile,
        avatar: profile.avatar ?? null,
        coins: profile.coins ?? 0,
        role: profile.role ?? "user",
      }),
    );

    navigate(profile.role === "admin" ? "/admin" : "/home", {
      replace: true,
    });
  }, [profile, dispatch, navigate]);

  if (authFailed) {
    return (
      <main className="auth-callback" role="alert">
        <div className="auth-callback__card">
          <span className="auth-callback__eyebrow">Google OAuth</span>
          <h1>Đăng nhập chưa hoàn tất</h1>
          <p>
            Google không thể xác thực tài khoản hoặc callback không hợp lệ. Hãy
            thử lại và kiểm tra Authorized redirect URI nếu lỗi tiếp tục xảy ra.
          </p>
          <button
            type="button"
            onClick={() => navigate("/home", { replace: true })}
          >
            Về trang chủ
          </button>
        </div>
      </main>
    );
  }

  if (isError && !isLoading && !isFetching) {
    return (
      <main className="auth-callback" role="alert">
        <div className="auth-callback__card">
          <span className="auth-callback__eyebrow">Google OAuth</span>
          <h1>Không đọc được phiên đăng nhập</h1>
          <p>
            Callback đã quay về website nhưng cookie phiên chưa sử dụng được.
            Bạn có thể thử lại một lần hoặc quay về trang chủ.
          </p>
          <div className="auth-callback__actions">
            <button type="button" onClick={() => void refetch()}>
              Thử lại
            </button>
            <button
              type="button"
              className="auth-callback__secondary"
              onClick={() => navigate("/home", { replace: true })}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-callback" role="status" aria-live="polite">
      <div className="auth-callback__card">
        <span className="auth-callback__spinner" aria-hidden="true" />
        <span className="auth-callback__eyebrow">Google OAuth</span>
        <h1>Đang hoàn tất đăng nhập</h1>
        <p>OmexLive đang khôi phục phiên đăng nhập an toàn của bạn.</p>
      </div>
    </main>
  );
};

export default AuthCallback;
