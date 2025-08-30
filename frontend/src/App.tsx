import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { StatCard } from "./components/StatCard";
import { LineChartComponent } from "./components/charts/LineChartComponent";
import { RestaurantList } from "./components/RestaurantList";
import { FiltersPanel } from "./components/FiltersPanel";
import { PeakHoursCard } from "./components/PeakHoursCard";

// Types
interface PeakHoursData {
  [dayIndex: number]: string[];
}

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
}

interface AnalyticsData {
  summary: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
  };
  daily_trends: Array<{
    date: string;
    orders: number;
    revenue: number;
    peak_hour: string;
  }>;
  top_restaurants: Array<{
    name: string;
    revenue: number;
  }>;
  peak_hours: PeakHoursData;
}

interface RestaurantResponse {
  data: Restaurant[];
  meta: Record<string, unknown>;
}

// Constants
const API_BASE_URL = "http://localhost:8000/api/index.php";

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

  // Filter States with better defaults
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

  // Create cache key for analytics data
  const cacheKey = useMemo(() => {
    return `analytics-${selectedRestaurant?.id || "all"}-${
      dateRange.startDate
    }-${dateRange.endDate}-${amountRange.min}-${amountRange.max}-${
      hourRange.min
    }-${hourRange.max}`;
  }, [selectedRestaurant, dateRange, amountRange, hourRange]);

  // Fetch analytics data when filters change
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters properly
        const params = new URLSearchParams();
        params.append("startDate", dateRange.startDate);
        params.append("endDate", dateRange.endDate);
        params.append("minAmount", amountRange.min.toString());
        params.append("maxAmount", amountRange.max.toString());
        params.append("startHour", hourRange.min.toString());
        params.append("endHour", hourRange.max.toString());

        if (selectedRestaurant) {
          params.append("restaurant_id", selectedRestaurant.id.toString());
        }

        const url = `${API_BASE_URL}/analytics?${params.toString()}`;
        console.log("Fetching analytics from:", url);

        const response = await axios.get(url);
        console.log("Raw API response:", response.data);

        // Validate and transform the response
        const rawData = response.data;

        // Ensure peak_hours is properly formatted
        const transformedPeakHours: PeakHoursData = {};
        if (rawData.peak_hours && typeof rawData.peak_hours === "object") {
          // Convert string keys to numbers and ensure arrays
          Object.entries(rawData.peak_hours).forEach(([day, hours]) => {
            const dayIndex = parseInt(day);
            if (!isNaN(dayIndex) && Array.isArray(hours)) {
              transformedPeakHours[dayIndex] = hours as string[];
            }
          });
        }

        const transformedData: AnalyticsData = {
          summary: {
            total_revenue: rawData.summary?.total_revenue || 0,
            total_orders: rawData.summary?.total_orders || 0,
            average_order_value: rawData.summary?.average_order_value || 0,
          },
          daily_trends: rawData.daily_trends || [],
          top_restaurants: rawData.top_restaurants || [],
          peak_hours: transformedPeakHours,
        };

        console.log("Transformed analytics data:", transformedData);
        setAnalyticsData(transformedData);
      } catch (err: any) {
        console.error("Error fetching analytics:", err);
        console.error("Error response:", err.response?.data);

        if (err.response?.status === 400) {
          setError(`Invalid parameters: ${err.response.data.error}`);
        } else {
          setError(
            "Could not fetch analytics data. Please check your backend server."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent too many API calls during rapid filter changes
    const timeoutId = setTimeout(fetchAnalytics, 300);
    return () => clearTimeout(timeoutId);
  }, [cacheKey, selectedRestaurant, dateRange, amountRange, hourRange]);

  // --- Event Handlers ---

  const handleExportData = () => {
    if (!analyticsData) return;

    const exportData = {
      filters: {
        restaurant: selectedRestaurant?.name || "All Restaurants",
        dateRange,
        amountRange,
        hourRange,
      },
      summary: analyticsData.summary,
      daily_trends: analyticsData.daily_trends,
      top_restaurants: analyticsData.top_restaurants,
      peak_hours: analyticsData.peak_hours,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `restaurant-analytics-${dateRange.startDate}-to-${dateRange.endDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setDateRange({
      startDate: "2025-06-22",
      endDate: "2025-06-28",
    });
    setAmountRange({ min: 0, max: 1000 });
    setHourRange({ min: 0, max: 23 });
    setSelectedRestaurant(null);
  };

  // --- Render ---

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Restaurant Analytics
            </h1>
            <p className="text-gray-500 mt-1">
              {selectedRestaurant
                ? `Showing data for ${selectedRestaurant.name}`
                : "Overview of all restaurants"}
            </p>
            {analyticsData && (
              <p className="text-sm text-gray-400 mt-1">
                Data from {dateRange.startDate} to {dateRange.endDate}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={handleExportData}
              disabled={!analyticsData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Export Data
            </button>
          </div>
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
              <div className="flex justify-center items-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3">Loading analytics...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-600 font-medium">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            <AnimatePresence>
              {!loading && !error && analyticsData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                      title="Total Revenue"
                      value={`$${analyticsData.summary.total_revenue.toLocaleString()}`}
                      trend={
                        analyticsData.daily_trends.length > 1
                          ? calculateTrend(
                              analyticsData.daily_trends,
                              "revenue"
                            )
                          : undefined
                      }
                    />
                    <StatCard
                      title="Total Orders"
                      value={analyticsData.summary.total_orders.toLocaleString()}
                      trend={
                        analyticsData.daily_trends.length > 1
                          ? calculateTrend(analyticsData.daily_trends, "orders")
                          : undefined
                      }
                    />
                    <StatCard
                      title="Average Order Value"
                      value={`${analyticsData.summary.average_order_value.toLocaleString()}`}
                    />
                  </div>

                  {/* Peak Hours Card */}
                  <div className="grid grid-cols-1 gap-6">
                    <PeakHoursCard peakHours={analyticsData.peak_hours} />
                  </div>

                  {/* Top Restaurants */}
                  {analyticsData.top_restaurants &&
                    analyticsData.top_restaurants.length > 0 && (
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">
                          Top Performing Restaurants
                        </h3>
                        <div className="space-y-3">
                          {analyticsData.top_restaurants.map(
                            (restaurant, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded"
                              >
                                <span className="font-medium">
                                  {restaurant.name}
                                </span>
                                <span className="text-green-600 font-semibold">
                                  ${restaurant.revenue.toLocaleString()}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

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

// Helper function to calculate trend
function calculateTrend(dailyData: any[], key: string): number {
  if (dailyData.length < 2) return 0;

  const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
  const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));

  const firstAvg =
    firstHalf.reduce((sum, day) => sum + day[key], 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, day) => sum + day[key], 0) / secondHalf.length;

  return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
}

export default App;
