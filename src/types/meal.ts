// MEAL System Types

export interface MEALRecord {
  id: string;
  user_id: string;
  status: 'active' | 'pending' | 'under_review' | 'approved' | 'completed';
  created_at: string;
  author_name: string;
  
  // PPA Details
  ppa_name: string;
  ppa_type: string;
  aip_reference_code: string;
  start_date: string;
  end_date: string;
  center_of_participation: string;
  sdg_goal: string;
  budget_allocated: number;
  budget_utilized: number;
  
  // Objectives
  objective_1: string;
  objective_2: string;
  objective_3: string;
  
  // Attendance
  expected_attendees: number;
  actual_attendees: number;
  
  // Gender
  male: number;
  female: number;
  
  // Age Groups
  age_below_14: number;
  age_15_17: number;
  age_18_24: number;
  age_25_30: number;
  age_30_and_above: number;
  
  // Supplementary Data
  lgbtqia: number;
  out_of_school_youth: number;
  indigenous_people: number;
  muslim: number;
  four_ps: number;
  persons_with_disability: number;
  
  // Organization
  sangguniang_kabataan: number;
  lydc: number;
  
  // Details
  highlights: string;
  outputs: string;
  partnerships_built: string;
  challenges_encountered: string;
  recommendations: string;
  
  // Review
  reviewer_notes: string;
  
  // Barangay Data (numerical)
  apokon: number;
  bincungan: number;
  busaon: number;
  canocotan: number;
  cuambogan: number;
  la_filipina: number;
  liboganon: number;
  madaum: number;
  magdum: number;
  magugpo_east: number;
  magugpo_north: number;
  magugpo_poblacion: number;
  magugpo_south: number;
  magugpo_west: number;
  mankilam: number;
  new_balamban: number;
  nueva_fuerza: number;
  pagsabangan: number;
  pandapan: number;
  san_agustin: number;
  san_isidro: number;
  san_miguel: number;
  visayan_village: number;
  outside_tagum: number;
  
  // RBAC Assignment
  assigned_to?: string;   // staff name or id this record is assigned to
  assigned_by?: string;   // name of meal_head who assigned it
}

export interface ActivityMonitor {
  id: string;
  activity_name: string;
  assigned_to: string;
  submission_deadline: string;
  reported_status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'overdue';
}

export interface PPAReport {
  id: string;
  ppa_name: string;
  date_implemented: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submitted_on: string;
  author: string;
  beneficiary_count: number;
  barangay: string;
}

// MEAL Analytics Data (for pdfExport)
export interface MEALAnalyticsData {
  barangayData: { name: string; value: number }[];
  monthlyData: { month: string; implementations: number; participants: number }[];
  ppaClassification: { name: string; value: number }[];
  genderData: { name: string; value: number }[];
  ageDistribution: { age: string; count: number }[];
  sdgGoals: { goal: string; count: number }[];
  totalRecords: number;
  totalBeneficiaries: number;
  averageBudgetUtilization: number;
}

// SK/LYDC Analytics Data (for Analytics page charts)
export interface SKLYDCAnalyticsData {
  summary: {
    skReports: number;
    lydcReports: number;
    totalUsers?: number;
  };
  monthlyData: { month: string; type: 'SK' | 'LYDC'; count: number }[];
}


