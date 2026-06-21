"""
Moderation Tools — các hàm thật mà Moderator Agent có thể gọi để
phân tích và xử lý vi phạm trong chat livestream.

Mỗi function ở đây là một "tool" theo định nghĩa của ADK: agent sẽ
đọc docstring + type hints để hiểu khi nào nên gọi tool nào, và tự
quyết định chuỗi hành động (reasoning -> tool call -> reasoning tiếp).
"""

import os
import httpx
from typing import Dict

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
AGENT_SERVICE_SECRET = os.getenv("AGENT_SERVICE_SECRET", "")

# In-memory store cho lịch sử vi phạm trong phiên hiện tại.
# Lưu ý: đây là demo/capstone scope — production nên dùng Redis hoặc MongoDB
# để lịch sử không mất khi service restart.
_violation_history: Dict[str, list] = {}


def get_user_violation_history(user_id: str) -> dict:
    """Lấy lịch sử vi phạm của một user trong phiên stream hiện tại.

    Dùng để agent quyết định mức độ xử phạt: lần đầu thì cảnh báo,
    lần 2 thì timeout, lần 3 trở lên thì ban hẳn.

    Args:
        user_id: ID của user cần kiểm tra lịch sử.

    Returns:
        dict chứa số lần vi phạm và danh sách lý do vi phạm trước đó.
    """
    history = _violation_history.get(user_id, [])
    return {
        "user_id": user_id,
        "violation_count": len(history),
        "reasons": history,
    }


def record_violation(user_id: str, reason: str) -> dict:
    """Ghi nhận một vi phạm mới vào lịch sử của user.

    Agent gọi tool này SAU KHI xác định message là toxic, để lần
    sau get_user_violation_history() trả về đúng số liệu.

    Args:
        user_id: ID của user vi phạm.
        reason: Lý do vi phạm (ví dụ: "Ngôn từ kích động").

    Returns:
        dict xác nhận đã ghi nhận, kèm tổng số vi phạm hiện tại.
    """
    if user_id not in _violation_history:
        _violation_history[user_id] = []
    _violation_history[user_id].append(reason)
    return {
        "recorded": True,
        "total_violations": len(_violation_history[user_id]),
    }


def timeout_user(user_id: str, stream_id: str, duration_seconds: int = 60) -> dict:
    """Tạm khóa quyền chat của user trong một khoảng thời gian.

    Gọi sang Node.js backend để thực thi hành động thật (emit Socket.io
    event chặn user gửi chat trong room đó).

    Args:
        user_id: ID của user cần timeout.
        stream_id: ID của stream đang diễn ra vi phạm.
        duration_seconds: Thời gian timeout tính bằng giây. Mặc định 60s.

    Returns:
        dict kết quả từ Node.js backend.
    """
    try:
        response = httpx.post(
            f"{NODE_BACKEND_URL}/api/moderation/timeout",
            json={
                "userId": user_id,
                "streamId": stream_id,
                "durationSeconds": duration_seconds,
            },
            headers={"x-agent-secret": AGENT_SERVICE_SECRET},
            timeout=5.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        return {"success": False, "error": str(e)}


def ban_user(user_id: str, stream_id: str, reason: str) -> dict:
    """Ban hẳn user khỏi việc chat trong stream (vi phạm nghiêm trọng
    hoặc tái phạm nhiều lần).

    Đây là hành động nặng nhất nên agent chỉ nên gọi sau khi đã xác
    nhận qua get_user_violation_history() rằng user đã vi phạm nhiều lần,
    hoặc nội dung vi phạm đặc biệt nghiêm trọng.

    Args:
        user_id: ID của user cần ban.
        stream_id: ID của stream.
        reason: Lý do ban, sẽ được lưu vào log và hiển thị cho user.

    Returns:
        dict kết quả từ Node.js backend.
    """
    try:
        response = httpx.post(
            f"{NODE_BACKEND_URL}/api/moderation/ban",
            json={"userId": user_id, "streamId": stream_id, "reason": reason},
            headers={"x-agent-secret": AGENT_SERVICE_SECRET},
            timeout=5.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        return {"success": False, "error": str(e)}