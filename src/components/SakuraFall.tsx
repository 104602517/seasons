import React from "react";
import "./SakaraFall.scss";

interface SakuraFallProps {
  petalCount?: number;
}

const SakuraFall: React.FC<SakuraFallProps> = ({ petalCount = 25 }) => {
  const petalTypes = ["p1", "p2", "p3", "p4", "p5"];

  const generatePetals = () => {
    const petals = [];
    for (let i = 0; i < petalCount; i++) {
      const petalType = petalTypes[i % petalTypes.length];
      petals.push(
        <div key={i} className={`petals ${petalType}`}>
          <div className="petal"></div>
        </div>
      );
    }
    return petals;
  };

  return (
    <div className="content">
      <div className="container">{generatePetals()}</div>
    </div>
  );
};

export default SakuraFall;
