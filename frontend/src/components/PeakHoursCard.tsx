import React from "react";

interface PeakHoursData {
  [dayIndex: number]: string[];
}

interface PeakHoursCardProps {
  peakHours: PeakHoursData;
}

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const PeakHoursCard: React.FC<PeakHoursCardProps> = ({ peakHours }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Peak Hours by Day</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {dayNames.map((dayName, index) => (
          <div key={index} className="text-center">
            <h4 className="font-medium text-sm text-gray-700 mb-2">
              {dayName}
            </h4>
            <div className="space-y-1">
              {peakHours[index] && peakHours[index].length > 0 ? (
                peakHours[index].slice(0, 3).map((timeRange, hourIndex) => (
                  <div
                    key={hourIndex}
                    className={`text-xs px-2 py-1 rounded ${
                      hourIndex === 0
                        ? "bg-indigo-100 text-indigo-800"
                        : hourIndex === 1
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {timeRange}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 px-2 py-1">No data</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
