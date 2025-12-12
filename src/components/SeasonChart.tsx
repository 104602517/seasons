import { useEffect, useRef, useState, type RefObject } from "react";
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
import { useVisibleSeasons } from "../hooks/index";

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

interface SeasonProps {
  appRef: RefObject<HTMLDivElement | null>;
}

export default function SeasonChart(props: SeasonProps) {
  const [seasonsData, setSeasonsData] = useState<Season[]>([]);
  const [containerWidth, setContainerWidth] = useState(800);
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
      <div ref={chartWrapperRef} className="chart-viewport">
        <div
          ref={containerRef}
          className="chart-container-inner"
          style={{
            minWidth: `${chartWidth}px`,
          }}
        >
          <Line ref={chartRef} data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
