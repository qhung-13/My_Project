import BrowseByGame from "./components/BrowseByGame/BrowseByGame";
import Hero from "./components/Hero/Hero";
import Leaderboard from "./components/Leaderboard/Leaderboard";
import LiveNow from "./components/LiveNow/LiveNow";
import Recommended from "./components/Recommended/Recommended";

const Home = () => {
  return (
    <div style={{ overflowX: "hidden" }}>
      <Hero />
      <LiveNow />
      <BrowseByGame />
      <Recommended />
      <Leaderboard />
    </div>
  );
};

export default Home;
