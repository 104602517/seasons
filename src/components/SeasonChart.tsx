import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useWindowWidth } from "../hooks/index";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip
);

interface Season {
  name: string;
  date: string;
  energy: number;
  body: string;
  mind: string;
}

export default function SeasonChart() {
  const [seasonsData, setSeasonsData] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);
  const windowWidth = useWindowWidth();
  const chartRef = useRef<ChartJS<"line">>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const VISIBLE_MONTHS = 4; // Show 4 months at a time
  const TRANSITION_DURATION = 300; // milliseconds

  useEffect(() => {
    fetch("/seasons.json")
      .then((response) => response.json())
      .then((data: Season[]) => {
        setSeasonsData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading seasons data:", error);
        setLoading(false);
      });
  }, []);

  // Handle container resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (chartWrapperRef.current) {
        setContainerWidth(chartWrapperRef.current.clientWidth);
      }
    };

    updateContainerWidth();

    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (chartWrapperRef.current) {
      resizeObserver.observe(chartWrapperRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate scroll boundaries with responsive max translateX
  const totalMonths = seasonsData.length;
  const baseMaxScrollPosition = Math.max(0, totalMonths - VISIBLE_MONTHS);

  // Calculate target max translateX based on screen width
  // At 710px: -4000px, wider screens: approach -3800px, narrower screens: approach -4200px
  const getTargetMaxTranslateX = (width: number) => {
    if (width >= 710) {
      // For wider screens: interpolate from -4000px at 710px to -3800px at 1200px+
      const progress = Math.min((width - 710) / (1800 - 710), 1);
      return -4000 + progress * 400; // -4000 to -3600
    } else {
      // For narrower screens: interpolate from -4000px at 710px to -4200px at 320px
      const progress = Math.min((710 - width) / (710 - 320), 1);
      return -4000 - progress * 200; // -4000 to -4200
    }
  };

  const targetMaxTranslateX = getTargetMaxTranslateX(windowWidth);
  const additionalScrollUnits =
    Math.abs(targetMaxTranslateX) / (containerWidth / VISIBLE_MONTHS) -
    baseMaxScrollPosition;

  const maxScrollPosition = baseMaxScrollPosition + additionalScrollUnits;

  console.log(
    targetMaxTranslateX,
    containerWidth,
    baseMaxScrollPosition,
    additionalScrollUnits,
    maxScrollPosition
  );

  // Calculate viewport position
  const chartWidth = containerWidth * (totalMonths / VISIBLE_MONTHS);
  const translateX = -scrollPosition * (containerWidth / VISIBLE_MONTHS);

  const smoothScrollTo = useCallback(
    (targetPosition: number) => {
      if (isScrolling) return;

      setIsScrolling(true);
      const startPosition = scrollPosition;
      const clampedTarget = Math.max(
        0,
        Math.min(maxScrollPosition, targetPosition)
      );
      console.log(clampedTarget);
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / TRANSITION_DURATION, 1);

        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const interpolatedPosition =
          startPosition + (clampedTarget - startPosition) * easeProgress;

        const clampedInterpolatedPosition = Math.max(
          0,
          Math.min(maxScrollPosition, interpolatedPosition)
        );

        console.log(
          clampedInterpolatedPosition,
          maxScrollPosition,
          interpolatedPosition
        );

        setScrollPosition(clampedInterpolatedPosition);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setScrollPosition(clampedTarget);
          setIsScrolling(false);
        }
      };

      requestAnimationFrame(animate);
    },
    [scrollPosition, maxScrollPosition, isScrolling]
  );

  // const handleWheel = useCallback(
  //   (e: WheelEvent | React.WheelEvent) => {
  //     e.preventDefault();

  //     const scrollDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY;

  //     const clampedScrollAmount = Math.max(-3, Math.min(3, scrollDelta));

  //     smoothScrollTo(scrollPosition + clampedScrollAmount);
  //   },
  //   [scrollPosition, smoothScrollTo]
  // );

  // const handleTouchStart = (e: React.TouchEvent) => {
  //   setTouchStartX(e.touches[0].clientX);
  //   setIsDragging(true);
  // };

  // const handleTouchEnd = (e: React.TouchEvent) => {
  //   if (!isDragging) return;

  //   const touchEndX = e.changedTouches[0].clientX;
  //   const diffX = touchStartX - touchEndX;
  //   const threshold = 50; // Minimum swipe distance

  //   if (Math.abs(diffX) > threshold) {
  //     const clampedScrollAmount = Math.max(-3, Math.min(3, diffX));

  //     smoothScrollTo(scrollPosition + clampedScrollAmount);
  //   }

  //   setIsDragging(false);
  // };

  // const handleTouchMove = useCallback((e: TouchEvent | React.TouchEvent) => {
  //   if (isDragging) {
  //     e.preventDefault();
  //   }
  // }, []);

  // useEffect(() => {
  //   const chartWrapper = chartWrapperRef.current;
  //   if (!chartWrapper) return;

  //   chartWrapper.addEventListener("touchmove", handleTouchMove, {
  //     passive: false,
  //   });

  //   return () => {
  //     chartWrapper.removeEventListener("touchmove", handleTouchMove);
  //   };
  // }, [handleTouchMove]);

  // if (loading) {
  //   return <div className="loading">Loading seasons data...</div>;
  // }

  // Prepare chart data for ALL seasons (full chart)
  const labels = seasonsData.map(
    (season) => `${season.name}\n(${season.date})`
  );
  const energyData = seasonsData.map((season) => season.energy);

  const data = {
    labels,
    datasets: [
      {
        label: "Energy Level",
        data: energyData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
        pointBackgroundColor: "rgb(75, 192, 192)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable chart animations for smooth scrolling
    },
    layout: {
      padding: {
        left: 10,
        right: 210,
        top: 10,
        bottom: 10,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "節氣名稱",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "能量指數",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        min: 40,
        max: 90,
        ticks: {
          stepSize: 10,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          beforeBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const season = seasonsData[index];
            return [`Date: ${season.date}`, `Energy: ${season.energy}`];
          },
          afterBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const season = seasonsData[index];
            return ["", "Body:", season.body, "", "Mind:", season.mind];
          },
        },
        bodyAlign: "left",
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  return (
    <div className="chart-container">
      <div
        ref={chartWrapperRef}
        className={`chart-viewport ${isScrolling ? "scrolling" : ""}`}
        // onTouchStart={handleTouchStart}
        // onTouchEnd={handleTouchEnd}
        // onTouchMove={handleTouchMove}
      >
        <div
          ref={containerRef}
          className="chart-container-inner"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isScrolling
              ? "none"
              : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            minWidth: `${chartWidth}px`,
          }}
        >
          <Line ref={chartRef} data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
