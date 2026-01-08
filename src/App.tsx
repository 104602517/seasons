import { useRef } from "react";
import "./App.scss";
import SeasonChart from "./components/SeasonChart";
import SakuraFall from "./components/SakuraFall/SakuraFall";
import RainFall from "./components/RainFall/RainFall";
import LightningEffect from "./components/LightningEffect/LightningEffect";
import GrowingTree from "./components/GrowingTree/GrowingTree";

function App() {
  const appRef = useRef<HTMLDivElement>(null);
  return (
    <div className="app" ref={appRef}>
      <div className="weather">
        <SakuraFall />
        <RainFall />
        <div className="grass-leaves">
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} className="grass-blade" />
          ))}
        </div>
        <div className="grass-leaves2">
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} className="grass-blade" />
          ))}
        </div>
        <div className="grass-leaves3">
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} className="grass-blade" />
          ))}
        </div>
        <LightningEffect />
        <GrowingTree />
      </div>
      <main className="app-main">
        <div className="sun"></div>
        <SeasonChart appRef={appRef} />
      </main>
    </div>
  );
}

export default App;
