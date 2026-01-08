import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
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
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import { useVisibleSeasons } from "../hooks/index";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  annotationPlugin
);

interface Season {
  name: string;
  date: string;
  energy: number;
  body: string;
  mind: string;
}

interface SeasonProps {
  appRef: RefObject<HTMLDivElement | null>;
}

// Helper function to parse date string like "1/5" to a Date object
const parseDateString = (dateStr: string, year: number): Date => {
  const [month, day] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

// Helper function to get today's position in the chart (0-23 scale)
const getTodayPosition = (seasonsData: Season[]): number => {
  if (seasonsData.length === 0) return 0;

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();

  // Find which two seasons we're between
  for (let i = 0; i < seasonsData.length; i++) {
    const currentSeason = seasonsData[i];
    const nextSeason = seasonsData[(i + 1) % seasonsData.length];

    const [currMonth, currDay] = currentSeason.date.split("/").map(Number);
    const [nextMonth, nextDay] = nextSeason.date.split("/").map(Number);

    // Handle year wrap (from December to January)
    let currentSeasonDate = parseDateString(currentSeason.date, currentYear);
    let nextSeasonDate = parseDateString(nextSeason.date, currentYear);

    // Adjust for year boundary
    if (nextMonth < currMonth || (nextMonth === currMonth && nextDay < currDay)) {
      // Next season is in the following year
      if (currentMonth >= currMonth) {
        nextSeasonDate = parseDateString(nextSeason.date, currentYear + 1);
      } else {
        currentSeasonDate = parseDateString(currentSeason.date, currentYear - 1);
      }
    }

    const todayDate = new Date(currentYear, currentMonth - 1, currentDay);

    // Check if today is between these two seasons
    if (todayDate >= currentSeasonDate && todayDate < nextSeasonDate) {
      // Calculate the interpolated position
      const totalDays = (nextSeasonDate.getTime() - currentSeasonDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysFromStart = (todayDate.getTime() - currentSeasonDate.getTime()) / (1000 * 60 * 60 * 24);
      const fraction = daysFromStart / totalDays;

      return i + fraction;
    }
  }

  // Fallback: find the closest season
  let closestIndex = 0;
  let minDiff = Infinity;

  for (let i = 0; i < seasonsData.length; i++) {
    const [month, day] = seasonsData[i].date.split("/").map(Number);
    const seasonDate = new Date(currentYear, month - 1, day);
    const diff = Math.abs(today.getTime() - seasonDate.getTime());

    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
};

export default function SeasonChart(props: SeasonProps) {
  const [seasonsData, setSeasonsData] = useState<Season[]>([]);
  const [containerWidth, setContainerWidth] = useState(800);
  const [todayPosition, setTodayPosition] = useState<number>(0);
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
  const [glowLineLeft, setGlowLineLeft] = useState<number | null>(null);
  const chartRef = useRef<ChartJS<"line">>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const VISIBLE_MONTHS = 4; // Show 4 months at a time

  useEffect(() => {
    fetch("/seasons.json")
      .then((response) => response.json())
      .then((data: Season[]) => {
        setSeasonsData(data);
      })
      .catch((error) => {
        console.error("Error loading seasons data:", error);
      });
  }, []);

  // Update today's position when data loads and periodically
  useEffect(() => {
    if (seasonsData.length === 0) return;

    const updatePosition = () => {
      const position = getTodayPosition(seasonsData);
      setTodayPosition(position);
    };

    updatePosition();

    // Update every minute to keep the line current
    const interval = setInterval(updatePosition, 6000);

    return () => clearInterval(interval);
  }, [seasonsData]);

  // Update glow line position after chart renders
  useEffect(() => {
    const updateGlowPosition = () => {
      if (chartRef.current && seasonsData.length > 0) {
        const chart = chartRef.current;
        const xScale = chart.scales.x;
        if (xScale) {
          const xPos = xScale.getPixelForValue(todayPosition);
          setGlowLineLeft(xPos);
        }
      }
    };

    // Delay to ensure chart is rendered
    const timeout = setTimeout(updateGlowPosition, 100);
    return () => clearTimeout(timeout);
  }, [seasonsData, todayPosition, containerWidth]);

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
  // Calculate viewport position
  const chartWidth = containerWidth * (totalMonths / VISIBLE_MONTHS);

  // Auto-scroll to today's position on load
  const scrollToToday = useCallback(() => {
    if (!chartWrapperRef.current || seasonsData.length === 0 || hasScrolledToToday) return;

    const widthPerSeason = chartWidth / totalMonths;
    const viewportWidth = chartWrapperRef.current.clientWidth;

    // Calculate scroll position to center today's position
    const todayScrollPosition = todayPosition * widthPerSeason - viewportWidth / 2;
    const maxScroll = chartWidth - viewportWidth;

    const targetScroll = Math.max(0, Math.min(todayScrollPosition, maxScroll));

    chartWrapperRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });

    setHasScrolledToToday(true);
  }, [chartWidth, totalMonths, todayPosition, seasonsData.length, hasScrolledToToday]);

  // Trigger scroll to today when chart is ready
  useEffect(() => {
    if (seasonsData.length > 0 && chartWidth > 0 && !hasScrolledToToday) {
      // Small delay to ensure chart is rendered
      const timeout = setTimeout(scrollToToday, 300);
      return () => clearTimeout(timeout);
    }
  }, [seasonsData, chartWidth, scrollToToday, hasScrolledToToday]);

  useVisibleSeasons(
    chartWrapperRef,
    seasonsData,
    chartWidth,
    totalMonths,
    props.appRef
  );

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
        left: 5,
        right: 15,
        top: 15,
        bottom: 15,
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
          afterBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const season = seasonsData[index];
            return ["", "Body:", season.body, "", "Mind:", season.mind];
          },
        },
        bodyAlign: "left",
      },
      annotation: {
        annotations: {
          todayLine: {
            type: "line",
            xMin: todayPosition,
            xMax: todayPosition,
            borderColor: "rgba(255, 60, 60, 0.9)",
            borderWidth: 3,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  return (
    <div className="chart-container">
      <div ref={chartWrapperRef} className="chart-viewport">
        <div
          ref={containerRef}
          className="chart-container-inner"
          style={{
            minWidth: `${chartWidth}px`,
          }}
        >
          <Line ref={chartRef} data={data} options={options} />
          {/* Glowing overlay line */}
          {glowLineLeft !== null && (
            <div
              className="today-line-glow"
              style={{
                left: `${glowLineLeft}px`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}


