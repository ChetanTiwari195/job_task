import { motion, AnimatePresence } from "framer-motion";
import { Filter, Calendar } from "lucide-react";
import type { DateRangeType, AmountRangeType, HourRangeType } from "../types";

interface FiltersPanelProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  dateRange: DateRangeType;
  setDateRange: (range: DateRangeType) => void;
  amountRange: AmountRangeType;
  setAmountRange: (range: AmountRangeType) => void;
  hourRange: HourRangeType;
  setHourRange: (range: HourRangeType) => void;
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
}) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
    <button
      onClick={() => setShowFilters(!showFilters)}
      className="w-full flex items-center justify-center py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 transition"
    >
      <Filter className="h-4 w-4 mr-2" /> {showFilters ? "Hide" : "Show"}{" "}
      Filters
    </button>
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden space-y-6 pt-6"
        >
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex items-center bg-white border rounded-md p-2">
              <Calendar className="h-4 w-4 mr-2" />
              <div className="grid grid-cols-2 gap-2 w-full">
                <input
                  type="date"
                  className="p-1 rounded bg-gray-50 border-gray-200 text-sm"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      startDate: e.target.value,
                    })
                  }
                />
                <input
                  type="date"
                  className="p-1 rounded bg-gray-50 border-gray-200 text-sm"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Amount (${amountRange.min} - ${amountRange.max})
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              value={amountRange.max}
              onChange={(e) =>
                setAmountRange({
                  ...amountRange,
                  max: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Hour Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peak Hour ({hourRange.min}:00 - {hourRange.max + 1}:00)
            </label>
            <input
              type="range"
              min="0"
              max="23"
              value={hourRange.max}
              onChange={(e) =>
                setHourRange({
                  ...hourRange,
                  max: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
