export interface ChartDataPoint {
  month: string;
  skReports: number;
  lydcReports: number;
}

export interface DashboardStats {
  pendingSK: number;
  pendingLYDC: number;
  councils: number;
  recentActivities: number;
}

export interface StaffStats {
  total: number;
  awaitingReview: number;
  approved: number;
  totalBeneficiaries: number;
  recentRecords?: import('./meal').MEALRecord[];
}

