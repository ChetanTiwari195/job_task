export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  location: string;
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
}

export interface DailyTrend {
  date: string;
  orders: number;
  revenue: number;
  peak_hour: string;
}

export interface TopRestaurant extends Restaurant {
  revenue: number;
}

export interface PeakHour {
  hour: string;
  orders: number;
}

export interface DailyPeakHours {
  [key: string]: PeakHour[];
}

export interface PeakHoursData {
  [key: string]: number[]; // day index (0-6) -> array of formatted hour ranges
}

export interface AnalyticsData {
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

export interface DateRangeType {
  startDate: string;
  endDate: string;
}

export interface AmountRangeType {
  min: number;
  max: number;
}

export interface HourRangeType {
  min: number;
  max: number;
}
