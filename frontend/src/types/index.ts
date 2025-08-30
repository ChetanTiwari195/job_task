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

export interface AnalyticsData {
  summary: AnalyticsSummary;
  daily_trends: DailyTrend[];
  top_restaurants: TopRestaurant[];
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
