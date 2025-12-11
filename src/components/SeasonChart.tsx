import { useEffect, useRef, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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

  // Calculate scroll boundaries
  const totalMonths = seasonsData.length;
  const maxScrollPosition = Math.max(0, totalMonths - VISIBLE_MONTHS);
  const scrollPercentage =
    maxScrollPosition > 0 ? scrollPosition / maxScrollPosition : 0;

  // Calculate viewport position
  const chartWidth = containerWidth * (totalMonths / VISIBLE_MONTHS);
  const translateX = -scrollPosition * (containerWidth / VISIBLE_MONTHS);

  // Navigation handlers
  const canGoBack = scrollPosition > 0;
  const canGoForward = scrollPosition < maxScrollPosition;

  const smoothScrollTo = useCallback(
    (targetPosition: number) => {
      if (isScrolling) return;

      setIsScrolling(true);
      const startPosition = scrollPosition;
      const clampedTarget = Math.max(
        0,
        Math.min(maxScrollPosition, targetPosition)
      );
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / TRANSITION_DURATION, 1);

        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const interpolatedPosition =
          startPosition + (clampedTarget - startPosition) * easeProgress;

        setScrollPosition(interpolatedPosition);

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

  const goBack = () => smoothScrollTo(scrollPosition - 1);
  const goForward = () => smoothScrollTo(scrollPosition + 1);

  // Touch and scroll handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(diffX) > threshold) {
      const direction = diffX > 0 ? 1 : -1;
      smoothScrollTo(scrollPosition + direction);
    }

    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaX > 0 ? 0.5 : -0.5;
    smoothScrollTo(scrollPosition + direction);
  };

  if (loading) {
    return <div className="loading">Loading seasons data...</div>;
  }

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
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Solar Terms (Traditional Chinese Calendar)",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        title: {
          display: true,
          text: "Energy Level",
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
      title: {
        display: true,
        text: "Energy Levels Through Traditional Chinese Solar Terms",
        font: {
          size: 18,
          weight: "bold",
        },
        padding: 20,
      },
      legend: {
        display: true,
        position: "top",
      },
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
      {/* Navigation Controls */}
      <div className="chart-navigation">
        <button
          onClick={goBack}
          disabled={!canGoBack || isScrolling}
          className={`nav-button nav-button-left ${
            !canGoBack || isScrolling ? "disabled" : ""
          }`}
        >
          ← Previous
        </button>

        <div className="chart-info">
          <span className="month-range">
            Showing {Math.floor(scrollPosition) + 1} -{" "}
            {Math.min(
              Math.floor(scrollPosition) + VISIBLE_MONTHS,
              seasonsData.length
            )}{" "}
            of {seasonsData.length} solar terms
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${scrollPercentage * 100}%`,
                transition: isScrolling ? "none" : "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <button
          onClick={goForward}
          disabled={!canGoForward || isScrolling}
          className={`nav-button nav-button-right ${
            !canGoForward || isScrolling ? "disabled" : ""
          }`}
        >
          Next →
        </button>
      </div>

      <div
        ref={chartWrapperRef}
        className={`chart-viewport ${isScrolling ? "scrolling" : ""}`}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <div
          ref={containerRef}
          className="chart-container-inner"
          style={{
            width: `${(totalMonths / VISIBLE_MONTHS) * 100}%`,
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
