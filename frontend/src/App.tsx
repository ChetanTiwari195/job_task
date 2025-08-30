import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { StatCard } from "./components/StatCard";
import { LineChartComponent } from "./components/charts/LineChartComponent";
import { RestaurantList } from "./components/RestaurantList";
import { FiltersPanel } from "./components/FiltersPanel";

// Types
import type { Restaurant, AnalyticsData } from "./types";

// Constants
const API_BASE_URL = "http://localhost:8000/api/index.php";

interface RestaurantResponse {
  data: Restaurant[];
  meta: Record<string, unknown>;
}

const App: React.FC = () => {
  // --- State Management ---
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [dateRange, setDateRange] = useState({
    startDate: "2025-06-22",
    endDate: "2025-06-28",
  });
  const [amountRange, setAmountRange] = useState({ min: 0, max: 1000 });
  const [hourRange, setHourRange] = useState({ min: 0, max: 23 });

  // --- Data Fetching Effects ---

  // Fetch restaurants on component mount
  useEffect(() => {
    axios
      .get<RestaurantResponse>(`${API_BASE_URL}/restaurants`)
      .then((response) => {
        setRestaurants(response.data.data);
      })
      .catch((err) => {
        console.error("Error fetching restaurants:", err);
        setError("Could not fetch restaurant data.");
      });
  }, []);

  // Add data caching to prevent unnecessary API calls
  const cacheKey = useMemo(() => {
    return `analytics-${selectedRestaurant?.id}-${dateRange.startDate}-${dateRange.endDate}`;
  }, [selectedRestaurant, dateRange]);

  // Fetch analytics data when filters or selected restaurant change
  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      minAmount: amountRange.min.toString(),
      maxAmount: amountRange.max.toString(),
      startHour: hourRange.min.toString(),
      endHour: hourRange.max.toString(),
    });

    if (selectedRestaurant) {
      params.append("restaurant_id", selectedRestaurant.id.toString());
    }

    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      setAnalyticsData(JSON.parse(cachedData));
      setLoading(false);
      return;
    }

    // Date range validation
    const validateDateRange = (start: string, end: string): boolean => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const now = new Date();
      return startDate <= endDate && startDate <= now && endDate <= now;
    };

    if (!validateDateRange(dateRange.startDate, dateRange.endDate)) {
      setError("Invalid date range");
      setLoading(false);
      return;
    }

    axios
      .get<AnalyticsData>(`${API_BASE_URL}/analytics?${params.toString()}`)
      .then((response) => {
        const transformedData: AnalyticsData = {
          summary: {
            total_revenue: response.data.summary.total_revenue || 0,
            total_orders: response.data.summary.total_orders || 0,
            average_order_value: response.data.summary.average_order_value || 0,
          },
          daily_trends: response.data.daily_trends.map((trend) => ({
            date: trend.date,
            orders: trend.orders || 0,
            revenue: trend.revenue || 0,
            peak_hour: trend.peak_hour || "",
          })),
          top_restaurants: response.data.top_restaurants || [],
        };

        setAnalyticsData(transformedData);
        sessionStorage.setItem(cacheKey, JSON.stringify(transformedData));
      })
      .catch((err) => {
        console.error("Error fetching analytics:", err);
        setError(
          "Could not fetch analytics data. Make sure the backend is running."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cacheKey, selectedRestaurant, dateRange, amountRange, hourRange]);

  // --- Render Functions ---

  // Add export functionality
  const handleExportData = () => {
    if (!analyticsData) return;

    const data = {
      summary: analyticsData.summary,
      daily_trends: analyticsData.daily_trends,
      top_restaurants: analyticsData.top_restaurants,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `restaurant-analytics-${dateRange.startDate}-${dateRange.endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Restaurant Analytics
            </h1>
            <p className="text-gray-500 mt-1">
              {selectedRestaurant
                ? `Showing data for ${selectedRestaurant.name}`
                : "Overview of all restaurants"}
            </p>
          </div>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Export Data
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <RestaurantList
              restaurants={restaurants}
              selectedRestaurant={selectedRestaurant}
              onSelectRestaurant={setSelectedRestaurant}
            />
            <FiltersPanel
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              dateRange={dateRange}
              setDateRange={setDateRange}
              amountRange={amountRange}
              setAmountRange={setAmountRange}
              hourRange={hourRange}
              setHourRange={setHourRange}
            />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {loading && (
              <div className="text-center p-10">Loading analytics...</div>
            )}
            {error && (
              <div className="text-center p-10 text-red-500">{error}</div>
            )}

            <AnimatePresence>
              {!loading && !error && analyticsData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                      title="Total Revenue"
                      value={`$${analyticsData.summary.total_revenue.toLocaleString()}`}
                    />
                    <StatCard
                      title="Total Orders"
                      value={analyticsData.summary.total_orders.toLocaleString()}
                    />
                    <StatCard
                      title="Average Order Value"
                      value={`$${analyticsData.summary.average_order_value.toLocaleString()}`}
                    />
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <LineChartComponent
                      title="Daily Orders"
                      data={analyticsData.daily_trends}
                      dataKey="orders"
                      color="#8884d8"
                    />
                    <LineChartComponent
                      title="Daily Revenue"
                      data={analyticsData.daily_trends}
                      dataKey="revenue"
                      color="#82ca9d"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
