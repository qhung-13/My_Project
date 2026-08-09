import { useGetLiveStreamsQuery } from "../../store/api/streamApi";
import BrowseByGame from "./components/BrowseByGame/BrowseByGame";
import Hero from "./components/Hero/Hero";
import Leaderboard from "./components/Leaderboard/Leaderboard";
import LiveNow from "./components/LiveNow/LiveNow";
import Recommended from "./components/Recommended/Recommended";
import "./Home.css";

const Home = () => {
  const { data, isLoading, isError, refetch } = useGetLiveStreamsQuery(
    { page: 1, limit: 50 },
    {
      pollingInterval: 10_000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const streams = data?.streams ?? [];

  return (
    <div className="home-page">
      <Hero streams={streams} />
      <LiveNow
        streams={streams.slice(0, 12)}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
      />
      <BrowseByGame streams={streams} />
      <Recommended />
      <Leaderboard liveStreams={streams} />
    </div>
  );
};

export default Home;
