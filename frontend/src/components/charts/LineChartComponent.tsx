import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import type { DailyTrend } from "../../types";

interface LineChartComponentProps {
  title: string;
  data: DailyTrend[];
  dataKey: "orders" | "revenue";
  color: string;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  title,
  data,
  dataKey,
  color,
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
    <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
