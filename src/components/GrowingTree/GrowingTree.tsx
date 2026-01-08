import React, { useEffect, useRef, useCallback, useState } from "react";
import "./GrowingTree.scss";

interface Branch {
  origin: { x: number; y: number };
  tip: { x: number; y: number };
  thickness: number;
  theta: number;
  magnitude: number;
  lightness: number;
  sprouts: number;
  done: boolean;
}

interface GrowingTreeProps {
  width?: number | "auto";
  height?: number | "auto";
  hue?: number;
  autoGrow?: boolean;
  growthRate?: number;
  showControls?: boolean;
}

const GrowingTree: React.FC<GrowingTreeProps> = ({
  width = "auto",
  height = "auto",
  hue: initialHue = 120,
  autoGrow = true,
  growthRate = 7,
  showControls = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const branchesRef = useRef<Branch[]>([]);
  const animationRef = useRef<number>(0);
  const [hue, setHue] = useState(initialHue);
  const [isGrowing, setIsGrowing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({
    width: typeof width === "number" ? width : window.innerWidth * 2,
    height: typeof height === "number" ? height : window.innerHeight,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: typeof width === "number" ? width : window.innerWidth * 2,
        height: typeof height === "number" ? height : window.innerHeight,
      });
    };

    if (width === "auto" || height === "auto") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [width, height]);

  const MAXIMUM_BEND = (90 / 180) * Math.PI;
  const SMALLEST_BRANCH = 40;

  const hsl = useCallback(
    (lightness: number) => `hsl(${hue}, 70%, ${lightness}%)`,
    [hue]
  );

  // Color based on thickness: dark brown for thick branches, green for thin
  const getBranchColor = useCallback(
    (thickness: number) => {
      const maxThickness = 30; // trunk thickness
      const minThickness = 1;  // smallest branch

      // Interpolate between brown (30) and green (100)
      const brownHue = 25;
      const greenHue = 100;

      // Normalize thickness to 0-1 range (inverted: thin = 1, thick = 0)
      const t = Math.min(1, Math.max(0, (maxThickness - thickness) / (maxThickness - minThickness)));

      // Lerp from brown to green
      const branchHue = brownHue + (greenHue - brownHue) * t;

      // Make thick branches darker (lower lightness)
      const darkBrownLightness = 20;  // dark for trunk
      const greenLightness = 25;      // brighter for leaves
      const branchLightness = darkBrownLightness + (greenLightness - darkBrownLightness) * t;

      return `hsl(${branchHue}, 50%, ${branchLightness}%)`;
    },
    []
  );

  const createBranch = useCallback(
    (
      origin: { x: number; y: number },
      magnitude: number,
      thickness: number,
      theta: number,
      lightness: number
    ): Branch => ({
      origin: { ...origin },
      tip: { x: origin.x, y: origin.y },
      thickness,
      theta,
      magnitude,
      lightness,
      sprouts: Math.floor(Math.random() * 4) + 1,
      done: false,
    }),
    []
  );

  const plantTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const magnitude = 230;
    const lightness = 50;
    const thickness = 30;
    const theta = 0;
    const origin = {
      x: canvas.width / 2,
      y: canvas.height,
    };

    branchesRef.current = [
      createBranch(origin, magnitude, thickness, theta, lightness),
    ];
    setIsGrowing(true);
  }, [createBranch]);

  const shoot = useCallback(
    (branch: Branch) => {
      if (branch.sprouts <= 0) return;
      branch.sprouts -= 1;
      shoot(branch);

      const theta2 =
        branch.theta + (Math.random() * MAXIMUM_BEND - MAXIMUM_BEND / 2);
      const magnitude2 = branch.magnitude * (Math.random() * 0.2 + 0.7);
      const lightness2 = branch.lightness * 0.9;

      branchesRef.current.push(
        createBranch(
          { x: branch.tip.x, y: branch.tip.y },
          magnitude2,
          branch.thickness * 0.6,
          theta2,
          lightness2
        )
      );
    },
    [createBranch, MAXIMUM_BEND]
  );

  const growBranch = useCallback(
    (branch: Branch) => {
      if (branch.done) return;

      const x = branch.tip.x - branch.origin.x;
      const y = branch.tip.y - branch.origin.y;
      const h = Math.sqrt(x * x + y * y);

      if (h >= branch.magnitude) {
        branch.done = true;
        if (branch.magnitude >= SMALLEST_BRANCH) {
          shoot(branch);
        }
        return;
      }

      branch.tip.x += Math.sin(branch.theta) * growthRate;
      branch.tip.y -= Math.cos(branch.theta) * growthRate;
    },
    [shoot, growthRate, SMALLEST_BRANCH]
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      branchesRef.current.forEach((branch) => {
        const w = branch.thickness;
        const oX1 = branch.origin.x - w;
        const oX2 = branch.origin.x + w;
        const oY = branch.origin.y;
        const tX1 = branch.tip.x - w * 0.8;
        const tX2 = branch.tip.x + w * 0.8;
        const tY = branch.tip.y;
        const cpX1 = (oX1 + oX1 + tX1) / 3;
        const cpY1 = (oY + tY + tY) / 3;
        const cpX2 = (oX2 + oX2 + tX2) / 3;
        const cpY2 = (oY + tY + tY) / 3;

        ctx.beginPath();
        ctx.moveTo(oX1, oY);
        ctx.quadraticCurveTo(cpX1, cpY1, tX1, tY);
        ctx.lineTo(tX2, tY);
        ctx.quadraticCurveTo(cpX2, cpY2, oX2, oY);
        ctx.lineWidth = 1;
        ctx.fillStyle = getBranchColor(branch.thickness);
        ctx.fill();
      });
    },
    [getBranchColor]
  );

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    branchesRef.current.forEach(growBranch);
    draw(ctx);

    // Check if tree is still growing
    const stillGrowing = branchesRef.current.some((branch) => !branch.done);
    if (stillGrowing) {
      animationRef.current = requestAnimationFrame(loop);
    } else {
      setIsGrowing(false);
    }
  }, [growBranch, draw]);

  // Auto-grow on mount
  useEffect(() => {
    if (autoGrow) {
      plantTree();
    }
  }, [autoGrow, plantTree]);

  // Animation loop
  useEffect(() => {
    if (isGrowing) {
      animationRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isGrowing, loop]);

  const handleGrow = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    plantTree();
  };

  return (
    <div className="growing-tree-container">
      <canvas
        ref={canvasRef}
        className="tree-canvas"
        width={canvasSize.width}
        height={canvasSize.height}
      />
      {showControls && (
        <div className="tree-controls">
          <button className="grow-btn" onClick={handleGrow}>
            Grow
          </button>
          <div className="hue-control">
            <input
              type="range"
              min="0"
              max="359"
              value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
            />
            <div
              className="swatch"
              style={{ backgroundColor: hsl(50) }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowingTree;
