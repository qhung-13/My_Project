"""
Scheduler Tools — các hàm thật mà Scheduler Agent có thể gọi để
phân tích dữ liệu stream cũ và đề xuất lịch livestream tối ưu.
"""

import os
import httpx
from datetime import datetime
from collections import Counter

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
AGENT_SERVICE_SECRET = os.getenv("AGENT_SERVICE_SECRET", "")


def get_streamer_history(user_id: str) -> dict:
    """Lấy lịch sử các stream trước đây của 1 streamer từ Node.js backend.

    Trả về danh sách stream cũ kèm thời gian bắt đầu, thời lượng,
    và viewer trung bình/đỉnh — dữ liệu thô để agent tự phân tích pattern.

    Args:
        user_id: ID của streamer cần lấy lịch sử.

    Returns:
        dict chứa danh sách stream cũ, hoặc lỗi nếu không lấy được.
    """
    try:
        response = httpx.get(
            f"{NODE_BACKEND_URL}/api/streams/analytics/{user_id}",
            headers={"x-agent-secret": AGENT_SERVICE_SECRET},
            timeout=5.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        return {"success": False, "error": str(e), "streams": []}


def analyze_viewer_patterns(streams: list) -> dict:
    """Phân tích danh sách stream cũ để tìm khung giờ và thứ trong tuần
    có viewer trung bình cao nhất.

    Đây là tool tính toán thuần (không gọi API ngoài) — agent dùng
    kết quả này làm input cho propose_optimal_schedule().

    Args:
        streams: Danh sách dict, mỗi dict có "startedAt" (ISO string)
            và "peakViewers" (int), lấy từ get_streamer_history().

    Returns:
        dict chứa giờ tốt nhất, thứ tốt nhất trong tuần, và viewer
        trung bình tương ứng.
    """
    if not streams:
        return {
            "best_hour": None,
            "best_weekday": None,
            "avg_viewers": 0,
            "sample_size": 0,
        }

    hour_viewers: dict[int, list] = {}
    weekday_viewers: dict[int, list] = {}

    for s in streams:
        try:
            started = datetime.fromisoformat(s["startedAt"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            continue
        viewers = s.get("peakViewers", 0)

        hour_viewers.setdefault(started.hour, []).append(viewers)
        weekday_viewers.setdefault(started.weekday(), []).append(viewers)

    if not hour_viewers:
        return {
            "best_hour": None,
            "best_weekday": None,
            "avg_viewers": 0,
            "sample_size": 0,
        }

    best_hour = max(hour_viewers, key=lambda h: sum(hour_viewers[h]) / len(hour_viewers[h]))
    best_weekday = max(
        weekday_viewers, key=lambda d: sum(weekday_viewers[d]) / len(weekday_viewers[d])
    )

    all_viewers = [v for lst in hour_viewers.values() for v in lst]

    weekday_names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]

    return {
        "best_hour": best_hour,
        "best_weekday": weekday_names[best_weekday],
        "avg_viewers_at_best_hour": round(
            sum(hour_viewers[best_hour]) / len(hour_viewers[best_hour])
        ),
        "sample_size": len(streams),
    }


def create_stream_notification(user_id: str, proposed_time: str, message: str) -> dict:
    """Tạo thông báo gửi tới followers của streamer về lịch live sắp tới.

    Gọi sang Node.js backend để tạo notification thật trong DB và
    (tương lai) emit Socket.io tới các follower đang online.

    Args:
        user_id: ID của streamer.
        proposed_time: Thời gian đề xuất, định dạng ISO string.
        message: Nội dung thông báo gửi tới followers.

    Returns:
        dict kết quả từ Node.js backend.
    """
    try:
        response = httpx.post(
            f"{NODE_BACKEND_URL}/api/notifications/schedule-announcement",
            json={
                "userId": user_id,
                "proposedTime": proposed_time,
                "message": message,
            },
            headers={"x-agent-secret": AGENT_SERVICE_SECRET},
            timeout=5.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        return {"success": False, "error": str(e)}