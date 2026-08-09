import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import buildStreamAnalytics from "../utils/streamAnalytics.js";

const AGENT_TIMEOUT_MS = 20_000;

const askCreatorCoach = asyncHandler(async (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message || message.length > 1000) {
    res.status(400);
    throw new Error("Message must contain between 1 and 1000 characters");
  }

  const agentBaseUrl = String(
    process.env.AGENT_SERVICE_URL || "http://localhost:8001",
  ).replace(/\/+$/, "");
  const secret = process.env.AGENT_SERVICE_SECRET;
  if (!secret) {
    res.status(503);
    throw new Error("Creator Coach is not configured");
  }

  const analytics = await buildStreamAnalytics(req.user._id);

  let response;
  try {
    response = await fetch(`${agentBaseUrl}/creator/coach`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-agent-secret": secret,
      },
      body: JSON.stringify({
        userId: req.user._id.toString(),
        message,
        analytics,
      }),
      signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
    });
  } catch (error) {
    console.warn("Creator Coach service unavailable:", error.message);
    res.status(503);
    throw new Error("Creator Coach is temporarily unavailable");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.warn(
      `Creator Coach returned HTTP ${response.status}:`,
      payload.detail || payload.message || "unknown error",
    );
    res.status(response.status >= 500 ? 503 : 502);
    throw new Error("Creator Coach could not answer this request");
  }

  res.status(200).json({ answer: String(payload.answer || "").trim() });
});

export { askCreatorCoach };
