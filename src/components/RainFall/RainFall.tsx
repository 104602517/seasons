import React, { useState, useEffect } from "react";
import "./RainFall.scss";

interface RainDrop {
  id: string;
  left?: number;
  right?: number;
  bottom: number;
  animationDelay: number;
  animationDuration: number;
}

const RainFall: React.FC = () => {
  const [frontRowDrops, setFrontRowDrops] = useState<RainDrop[]>([]);
  const [backRowDrops, setBackRowDrops] = useState<RainDrop[]>([]);

  const makeItRain = () => {
    const drops: RainDrop[] = [];
    const backDrops: RainDrop[] = [];
    let increment = 0;

    while (increment < 100) {
      // Random number between 98 and 1
      const randoHundo = Math.floor(Math.random() * (98 - 1 + 1) + 1);
      // Random number between 5 and 2
      const randoFiver = Math.floor(Math.random() * (5 - 2 + 1) + 2);

      increment += randoFiver;

      const animationDelay = randoHundo / 100; // Convert to decimal
      const animationDuration = 0.5 + randoHundo / 100;
      const bottom = Math.max(70, Math.random() * 100);

      // Front row drops
      drops.push({
        id: `front-${increment}-${randoHundo}`,
        left: increment,
        bottom,
        animationDelay,
        animationDuration,
      });

      // Back row drops
      backDrops.push({
        id: `back-${increment}-${randoHundo}`,
        right: increment,
        bottom,
        animationDelay,
        animationDuration,
      });
    }

    setFrontRowDrops(drops);
    setBackRowDrops(backDrops);
  };

  useEffect(() => {
    makeItRain();
  }, []);

  const renderDrop = (drop: RainDrop) => (
    <div
      key={drop.id}
      className="drop"
      style={{
        left: drop.left ? `${drop.left}%` : undefined,
        right: drop.right ? `${drop.right}%` : undefined,
        bottom: `${drop.bottom}%`,
        animationDelay: `${drop.animationDelay}s`,
        animationDuration: `${drop.animationDuration}s`,
      }}
    >
      <div
        className="stem"
        style={{
          animationDelay: `${drop.animationDelay}s`,
          animationDuration: `${drop.animationDuration}s`,
        }}
      />
      <div
        className="splat"
        style={{
          animationDelay: `${drop.animationDelay}s`,
          animationDuration: `${drop.animationDuration}s`,
        }}
      />
    </div>
  );

  return (
    <div className="rain-container">
      <div className="rain front-row">{frontRowDrops.map(renderDrop)}</div>
      <div className="rain back-row">{backRowDrops.map(renderDrop)}</div>
    </div>
  );
};

export default RainFall;
