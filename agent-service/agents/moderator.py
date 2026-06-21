"""
Moderator Agent — agent chịu trách nhiệm giám sát chat livestream.

Khác với hàm checkToxicComment cũ (1 lần gọi LLM -> trả JSON cố định),
agent này được trao một bộ "tools" và TỰ QUYẾT ĐỊNH:
  1. Có cần kiểm tra độc hại không
  2. Nếu độc hại -> ghi nhận vi phạm
  3. Tra cứu lịch sử vi phạm của user đó
  4. Tự chọn hành động phù hợp: bỏ qua / cảnh báo / timeout / ban
     dựa trên SỐ LẦN vi phạm trước đó — đây là phần thể hiện rõ
     "reasoning + tool use" mà checkToxicComment cũ không có.
"""

from google.adk.agents import Agent

from tools.moderation_tools import (
    get_user_violation_history,
    record_violation,
    timeout_user,
    ban_user,
)

MODERATOR_INSTRUCTION = """
Bạn là Moderator Agent cho nền tảng livestream OmexLive. Nhiệm vụ của
bạn là giám sát một tin nhắn chat và quyết định hành động phù hợp.

QUY TRÌNH BẮT BUỘC khi nhận một tin nhắn cần kiểm duyệt:

1. Đánh giá nội dung tin nhắn xem có chứa: chửi thề, lăng mạ, phân
   biệt đối xử, quấy rối, hoặc nội dung kích động hay không. Hãy tự
   đánh giá dựa trên hiểu biết ngôn ngữ của bạn, không cần tool riêng
   cho bước này.

2. NẾU tin nhắn KHÔNG độc hại: trả lời với is_toxic=false, không gọi
   thêm tool nào, kết thúc.

3. NẾU tin nhắn ĐỘC HẠI:
   a. Gọi get_user_violation_history(user_id) để xem user đã vi phạm
      bao nhiêu lần trước đó trong phiên này.
   b. Gọi record_violation(user_id, reason) để ghi nhận vi phạm hiện tại.
   c. Dựa trên TỔNG SỐ vi phạm (bao gồm lần này), quyết định hành động:
      - Vi phạm lần 1: chỉ cảnh báo, KHÔNG gọi timeout_user hay ban_user.
      - Vi phạm lần 2: gọi timeout_user(user_id, stream_id, 60) — khóa
        chat 60 giây.
      - Vi phạm lần 3 trở lên: gọi ban_user(user_id, stream_id, reason)
        — ban hẳn khỏi stream.
   d. Luôn trả lời cuối cùng bằng tóm tắt: tin nhắn có độc hại không,
      lý do, hành động đã thực hiện (nếu có).

Luôn trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.
"""

moderator_agent = Agent(
    name="moderator_agent",
    model="gemini-2.0-flash",
    description="Giám sát chat livestream, tự quyết định cảnh báo/timeout/ban dựa trên lịch sử vi phạm.",
    instruction=MODERATOR_INSTRUCTION,
    tools=[
        get_user_violation_history,
        record_violation,
        timeout_user,
        ban_user,
    ],
)