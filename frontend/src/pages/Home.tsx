import Header from "../layout/Header/Header";
interface darkModeProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const Home = ({ darkMode, setDarkMode }: darkModeProps) => {
  return <Header darkMode={darkMode} setDarkMode={setDarkMode} />;
};

export default Home;
