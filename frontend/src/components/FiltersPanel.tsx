import React from "react";
import { motion } from "framer-motion";

interface FiltersPanelProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  dateRange: { startDate: string; endDate: string };
  setDateRange: (range: { startDate: string; endDate: string }) => void;
  amountRange: { min: number; max: number };
  setAmountRange: (range: { min: number; max: number }) => void;
  hourRange: { min: number; max: number };
  setHourRange: (range: { min: number; max: number }) => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  showFilters,
  setShowFilters,
  dateRange,
  setDateRange,
  amountRange,
  setAmountRange,
  hourRange,
  setHourRange,
}) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full flex justify-between items-center text-left font-medium text-gray-900 mb-4"
      >
        Filters
        <span
          className={`transform transition-transform ${
            showFilters ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: showFilters ? "auto" : 0,
          opacity: showFilters ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="space-y-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Amount Range
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={amountRange.min}
                  onChange={(e) =>
                    setAmountRange({
                      ...amountRange,
                      min: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={amountRange.max}
                  onChange={(e) =>
                    setAmountRange({
                      ...amountRange,
                      max: Math.max(
                        amountRange.min,
                        parseFloat(e.target.value) || 1000
                      ),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="text-xs text-gray-500">
                ${amountRange.min} - ${amountRange.max}
              </div>
            </div>
          </div>

          {/* Hour Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hour Range
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <select
                  value={hourRange.min}
                  onChange={(e) =>
                    setHourRange({
                      ...hourRange,
                      min: Math.min(parseInt(e.target.value), hourRange.max),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <select
                  value={hourRange.max}
                  onChange={(e) =>
                    setHourRange({
                      ...hourRange,
                      max: Math.max(parseInt(e.target.value), hourRange.min),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-500">
                {hourRange.min.toString().padStart(2, "0")}:00 -{" "}
                {hourRange.max.toString().padStart(2, "0")}:00
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
