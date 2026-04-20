import BrowseByGame from "./components/BrowseByGame/BrowseByGame";
import Hero from "./components/Hero/Hero";
import Leaderboard from "./components/Leaderboard/Leaderboard";
import LiveNow from "./components/LiveNow/LiveNow";
import Recommended from "./components/Recommended/Recommended";
import "./Home.css"

const Home = () => {
  return (
    <div className="home-page">
      <Hero />
      <LiveNow />
      <BrowseByGame />
      <Recommended />
      <Leaderboard />
    </div>
  );
};

export default Home;
