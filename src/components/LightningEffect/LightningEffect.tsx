import React, { useRef, useEffect, useCallback } from "react";
import "./LightningEffect.scss";

interface LightningConfig {
  color: string;
  shadowColor: string;
  thickness: number;
  branchChance: number;
  branchFactor: number;
  straightness: number;
  maxSegments: number;
  maxBranches: number;
  fadeDuration: number;
}

const LightningEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const LIGHTNING_INTERVAL = 6 * 1000;

  const lightningConfig: LightningConfig = {
    color: "rgba(176, 217, 242, 0.5)",
    shadowColor: "#00aaff",
    // 控制閃電的細緻程度
    // 調高：閃電會比較粗糙、線段更少、看起來更簡單
    // 調低：閃電會更細緻、線段更多、看起來更複雜精細
    thickness: 4,
    // 產生分支的機率 (0-1之間)
    // 調高：閃電分支更多，看起來更茂密像樹枝
    // 調低：閃電分支更少，看起來更簡潔
    branchChance: 0.4,
    // 分支的長度係數
    // 調高：分支會更長更明顯
    // 調低：分支會更短更細小
    branchFactor: 0.9,
    // 閃電的直線程度 (0-1之間)
    // 調高：閃電會比較直，像一條稍微彎曲的線
    // 調低：閃電會很彎很亂，像閃電蛇一樣扭來扭去
    straightness: 0.7,
    // 最大線段數量限制
    // 調高：閃電可以有更多細節和轉折
    // 調低：閃電會比較簡單，細節較少
    maxSegments: 35,
    // 最大分支層級 (分支的分支的分支...)
    // 調高：可以有分支的分支的分支，看起來像複雜的樹狀結構
    // 調低：分支層級簡單，不會有太多層的分岔
    maxBranches: 5,
    // 閃電淡出消失的時間 (毫秒)
    // 調高：閃電會慢慢消失，停留更久
    // 調低：閃電會快速消失，一閃即逝
    fadeDuration: 1300,
  };

  const createLightning = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      displace: number,
      branchLevel = 0
    ) => {
      if (
        displace < lightningConfig.thickness ||
        branchLevel > lightningConfig.maxBranches
      ) {
        ctx.lineWidth = displace * 0.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        return;
      }

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const offsetX = (Math.random() - 0.5) * displace * 2;
      const offsetY = (Math.random() - 0.5) * displace * 2;
      const adjustedMidX = midX + offsetX * (1 - lightningConfig.straightness);
      const adjustedMidY = midY + offsetY * (1 - lightningConfig.straightness);

      createLightning(
        ctx,
        startX,
        startY,
        adjustedMidX,
        adjustedMidY,
        displace / 2,
        branchLevel
      );
      createLightning(
        ctx,
        adjustedMidX,
        adjustedMidY,
        endX,
        endY,
        displace / 2,
        branchLevel
      );

      if (
        branchLevel < lightningConfig.maxBranches &&
        Math.random() < lightningConfig.branchChance
      ) {
        const branchEndX = adjustedMidX + (Math.random() - 0.5) * displace * 2;
        const branchEndY = adjustedMidY + (Math.random() - 0.5) * displace * 2;
        createLightning(
          ctx,
          adjustedMidX,
          adjustedMidY,
          branchEndX,
          branchEndY,
          displace * lightningConfig.branchFactor,
          branchLevel + 1
        );
      }
    },
    [lightningConfig]
  );

  const lightningStrike = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = lightningConfig.color;
      ctx.shadowColor = lightningConfig.shadowColor;
      ctx.shadowBlur = 80;
      ctx.lineCap = "round";

      const boltsCount = 6 + Math.floor(Math.random() * 3);

      for (let i = 0; i < boltsCount; i++) {
        setTimeout(() => {
          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Bright flash
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(173, 216, 230, 0.4)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const flashStartX = Math.random() * canvas.width;
          const flashStartY = 0;
          const endX = x + (Math.random() - 0.5) * 100;
          const endY = y + (Math.random() - 0.5) * canvas.height;

          createLightning(ctx, flashStartX, flashStartY, endX, endY, 30);

          let opacity = 1;
          const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            if (opacity <= 0) {
              clearInterval(fadeInterval);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
              ctx.globalAlpha = opacity;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = `rgba(173, 216, 230, ${opacity * 0.4})`;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          }, lightningConfig.fadeDuration / 20);
        }, i * 100);
      }
    },
    [createLightning, lightningConfig]
  );

  const handleCanvasClick = useCallback(
    (e?: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let x: number, y: number;

      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      } else {
        // Default to center of canvas
        x = canvas.width / 2;
        y = canvas.height / 2;
      }

      lightningStrike(x, y);
    },
    [lightningStrike]
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    resizeCanvas();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);

    // Fire auto-strike at center on load
    const canvas = canvasRef.current;
    if (canvas) {
      setTimeout(() => {
        lightningStrike(canvas.width / 2, canvas.height / 2);
      }, 100);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [resizeCanvas, lightningStrike]);

  useEffect(() => {
    let lightning_timer: number | null | undefined = null;
    setTimeout(() => {
      lightning_timer = setInterval(() => {
        handleCanvasClick();
      }, LIGHTNING_INTERVAL);
    }, 2000);

    return () => {
      if (lightning_timer !== null) clearInterval(lightning_timer);
    };
  }, []);

  return (
    <div className="lightning-container">
      <canvas ref={canvasRef} className="lightning-canvas" />
    </div>
  );
};

export default LightningEffect;
