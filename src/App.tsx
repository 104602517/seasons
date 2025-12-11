import "./App.css";
import SeasonChart from "./components/SeasonChart";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Traditional Chinese Solar Terms - Energy Cycle</h1>
        <p>
          Explore how energy levels change throughout the year according to
          traditional Chinese calendar
        </p>
      </header>
      <main className="app-main">
        <SeasonChart />
      </main>
    </div>
  );
}

export default App;
