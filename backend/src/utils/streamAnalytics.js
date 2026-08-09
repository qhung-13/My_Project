import mongoose from "mongoose";
import Donation from "../models/Donation.model.js";
import Stream from "../models/Stream.model.js";

export const buildStreamAnalytics = async (userId) => {
  const objectId =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(userId);

  const streams = await Stream.find({ userId: objectId })
    .sort({ createdAt: -1 })
    .limit(100);

  const completedStreams = streams.filter(
    (stream) => stream.startedAt && stream.endedAt,
  );
  const totalHours = completedStreams.reduce(
    (sum, stream) =>
      sum + Math.max(0, (stream.endedAt - stream.startedAt) / 3_600_000),
    0,
  );
  const avgViewers = streams.length
    ? Math.round(
        streams.reduce((sum, stream) => sum + (stream.peakViewers || 0), 0) /
          streams.length,
      )
    : 0;
  const peakViewers = streams.reduce(
    (max, stream) => Math.max(max, stream.peakViewers || 0),
    0,
  );
  const viewerHistory = streams
    .slice(0, 10)
    .reverse()
    .map((stream) => ({
      date: new Date(stream.startedAt || stream.createdAt).toLocaleDateString(
        "vi-VN",
      ),
      viewers: stream.peakViewers || 0,
      duration:
        stream.startedAt && stream.endedAt
          ? Math.round(
              Math.max(0, (stream.endedAt - stream.startedAt) / 60_000),
            )
          : 0,
    }));

  const donationTotals = await Donation.aggregate([
    {
      $match: {
        toUserId: objectId,
        status: "completed",
      },
    },
    { $group: { _id: null, total: { $sum: "$coins" } } },
  ]);

  return {
    totalStreams: streams.length,
    totalHours: Math.round(totalHours * 10) / 10,
    avgViewers,
    peakViewers,
    totalCoinsReceived: donationTotals[0]?.total || 0,
    viewerHistory,
    streams: streams.map((stream) => ({
      _id: stream._id,
      title: stream.title,
      category: stream.category,
      startedAt: stream.startedAt || stream.createdAt,
      endedAt: stream.endedAt || null,
      peakViewers: stream.peakViewers || 0,
      viewers: stream.viewers || 0,
    })),
  };
};

export default buildStreamAnalytics;
