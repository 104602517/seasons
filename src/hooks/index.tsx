import { useEffect, useState, type RefObject } from "react";

interface Season {
  name: string;
  date: string;
  energy: number;
  body: string;
  mind: string;
}

interface VisibleRange {
  startIndex: number;
  endIndex: number;
  centerIndex: number;
  visibleSeasons: Season[];
  scrollPercentage: number;
  currentSeason: Season | null;
}

export const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return windowWidth;
};

export const useVisibleSeasons = (
  chartWrapperRef: RefObject<HTMLDivElement | null>,
  seasonsData: Season[],
  chartWidth: number,
  totalMonths: number,
  appRef: RefObject<HTMLDivElement | null>
) => {
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    startIndex: 0,
    endIndex: 0,
    centerIndex: 0,
    visibleSeasons: [],
    scrollPercentage: 0,
    currentSeason: null,
  });

  const getVisibleDataRange = (): VisibleRange => {
    if (!chartWrapperRef.current || !seasonsData.length) {
      return {
        startIndex: 0,
        endIndex: 0,
        centerIndex: 0,
        visibleSeasons: [],
        scrollPercentage: 0,
        currentSeason: null,
      };
    }

    const scrollLeft = chartWrapperRef.current.scrollLeft;
    const viewportWidth = chartWrapperRef.current.clientWidth;

    // Calculate the width per season/month
    const widthPerSeason = chartWidth / totalMonths;

    // Calculate which seasons are currently visible
    const startIndex = Math.max(0, Math.floor(scrollLeft / widthPerSeason));
    const endIndex = Math.min(
      totalMonths - 1,
      Math.ceil((scrollLeft + viewportWidth) / widthPerSeason)
    );

    // Get the actual visible seasons data
    const visibleSeasons = seasonsData.slice(startIndex, endIndex + 1);

    // Calculate the center point to determine the "main" season in view
    const centerScroll = scrollLeft + viewportWidth / 2;
    const centerIndex = Math.min(
      totalMonths - 1,
      Math.max(0, Math.round(centerScroll / widthPerSeason))
    );

    // Calculate scroll percentage (handle edge case where chart is smaller than viewport)
    const maxScroll = Math.max(0, chartWidth - viewportWidth);
    const scrollPercentage = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;

    return {
      startIndex,
      endIndex,
      centerIndex,
      visibleSeasons,
      scrollPercentage,
      currentSeason: seasonsData[centerIndex] || null,
    };
  };

  useEffect(() => {
    const handleScroll = () => {
      const range = getVisibleDataRange();
      setVisibleRange(range);
      if (range.currentSeason?.date && appRef.current) {
        // Parse the month from the date string
        const dateString = range.currentSeason.date;
        const [month, _] = dateString.split("/");

        // Remove all existing season classes
        appRef.current.classList.remove("spring", "summer", "autumn", "winter");
        // Add the appropriate season class based on month
        if (["3", "4", "5"].includes(month)) {
          appRef.current.classList.add("spring");
        } else if (["6", "7", "8"].includes(month)) {
          appRef.current.classList.add("summer");
        } else if (["9", "10", "11"].includes(month)) {
          appRef.current.classList.add("autumn");
        } else if (["12", "1", "2"].includes(month)) {
          appRef.current.classList.add("winter");
        }
      }
    };

    if (chartWrapperRef.current) {
      chartWrapperRef.current.addEventListener("scroll", handleScroll);
      // Initial calculation
      handleScroll();
    }

    return () => {
      if (chartWrapperRef.current) {
        chartWrapperRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [seasonsData, chartWidth, totalMonths]);

  return {
    visibleRange,
    getVisibleDataRange,
  };
};
