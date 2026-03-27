import { MEALRecord } from '../types/meal';

/**
 * Parse a CSV string into an array of objects
 */
export const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  // Parse data rows
  const result: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    const row: Record<string, string> = {};
    let currentCell = '';
    let insideQuotes = false;
    
    for (let j = 0; j < currentLine.length; j++) {
      const char = currentLine[j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        // End of cell
        const headerIndex = Object.keys(row).length;
        if (headerIndex < headers.length) {
          row[headers[headerIndex]] = currentCell.trim();
        }
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    // Add last cell
    const headerIndex = Object.keys(row).length;
    if (headerIndex < headers.length) {
      row[headers[headerIndex]] = currentCell.trim();
    }
    
    // Only add if row has data
    if (Object.values(row).some(v => v)) {
      result.push(row);
    }
  }

  return result;
};

/**
 * Normalize PPA Type to consistent values
 * Converts various formats to standard: 'Program', 'Project', 'Activity'
 */
export const normalizePPAType = (type: string): string => {
  if (!type) return '';
  
  const normalized = type.trim().toLowerCase();
  
  // Map various variations to standard values
  if (normalized === 'program' || normalized === 'programs' || normalized === 'programa') {
    return 'Program';
  }
  if (normalized === 'project' || normalized === 'projects' || normalized === 'proyecto') {
    return 'Project';
  }
  if (normalized === 'activity' || normalized === 'activities' || normalized === 'aktibidad') {
    return 'Activity';
  }
  
  // Return as-is if no match, but capitalize first letter
  return type.trim().charAt(0).toUpperCase() + type.trim().slice(1);
};

/**
 * Convert parsed CSV data to MEALRecord format
 */
export const convertToMEALRecord = (csvData: Record<string, string>[], userId: string, userName: string): MEALRecord[] => {
  return csvData.map((row, index) => ({
    id: `csv-${Date.now()}-${index}`,
    user_id: userId,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    author_name: userName,
    
    // PPA Details
    ppa_name: row['ppa_name'] || row['PPA Name'] || row['project_name'] || '',
    ppa_type: normalizePPAType(row['ppa_type'] || row['PPA Type'] || row['type'] || ''),
    aip_reference_code: row['aip_reference_code'] || row['AIP Reference Code'] || '',
    start_date: row['start_date'] || row['Start Date'] || '',
    end_date: row['end_date'] || row['End Date'] || '',
    center_of_participation: row['center_of_participation'] || row['Center of Participation'] || '',
    sdg_goal: row['sdg_goal'] || row['SDG Goal'] || row['sdg'] || '',
    budget_allocated: parseFloat(row['budget_allocated'] || row['Budget Allocated'] || '0') || 0,
    budget_utilized: parseFloat(row['budget_utilized'] || row['Budget Utilized'] || '0') || 0,
    
    // Objectives
    objective_1: row['objective_1'] || row['Objective 1'] || '',
    objective_2: row['objective_2'] || row['Objective 2'] || '',
    objective_3: row['objective_3'] || row['Objective 3'] || '',
    
    // Attendance
    expected_attendees: parseInt(row['expected_attendees'] || row['Expected Attendees'] || '0') || 0,
    actual_attendees: parseInt(row['actual_attendees'] || row['Actual Attendees'] || '0') || 0,
    
    // Gender
    male: parseInt(row['male'] || row['Male'] || '0') || 0,
    female: parseInt(row['female'] || row['Female'] || '0') || 0,
    
    // Age Groups
    age_below_14: parseInt(row['age_below_14'] || row['Age Below 14'] || '0') || 0,
    age_15_17: parseInt(row['age_15_17'] || row['Age 15-17'] || '0') || 0,
    age_18_24: parseInt(row['age_18_24'] || row['Age 18-24'] || '0') || 0,
    age_25_30: parseInt(row['age_25_30'] || row['Age 25-30'] || '0') || 0,
    age_30_and_above: parseInt(row['age_30_and_above'] || row['Age 30 and Above'] || '0') || 0,
    
    // Supplementary Data
    lgbtqia: parseInt(row['lgbtqia'] || row['LGBTQIA'] || '0') || 0,
    out_of_school_youth: parseInt(row['out_of_school_youth'] || row['Out of School Youth'] || '0') || 0,
    indigenous_people: parseInt(row['indigenous_people'] || row['Indigenous People'] || '0') || 0,
    muslim: parseInt(row['muslim'] || row['Muslim'] || '0') || 0,
    four_ps: parseInt(row['four_ps'] || row['4Ps'] || '0') || 0,
    persons_with_disability: parseInt(row['persons_with_disability'] || row['Persons with Disability'] || '0') || 0,
    
    // Organization
    sangguniang_kabataan: parseInt(row['sangguniang_kabataan'] || row['SK'] || row['sangguniangKabataan'] || '0') || 0,
    lydc: parseInt(row['lydc'] || row['LYDC'] || '0') || 0,
    
    // Details
    highlights: row['highlights'] || row['Highlights'] || '',
    outputs: row['outputs'] || row['Outputs'] || '',
    partnerships_built: row['partnerships_built'] || row['Partnerships'] || '',
    challenges_encountered: row['challenges_encountered'] || row['Challenges'] || '',
    recommendations: row['recommendations'] || row['Recommendations'] || '',
    
    // Review
    reviewer_notes: '',
    
    // Barangay Data
    apokon: parseInt(row['apokon'] || '0') || 0,
    bincungan: parseInt(row['bincungan'] || '0') || 0,
    busaon: parseInt(row['busaon'] || '0') || 0,
    canocotan: parseInt(row['canocotan'] || '0') || 0,
    cuambogan: parseInt(row['cuambogan'] || '0') || 0,
    la_filipina: parseInt(row['la_filipina'] || row['laFilipina'] || '0') || 0,
    liboganon: parseInt(row['liboganon'] || '0') || 0,
    madaum: parseInt(row['madaum'] || '0') || 0,
    magdum: parseInt(row['magdum'] || '0') || 0,
    magugpo_east: parseInt(row['magugpo_east'] || row['magugpoEast'] || '0') || 0,
    magugpo_north: parseInt(row['magugpo_north'] || row['magugpoNorth'] || '0') || 0,
    magugpo_poblacion: parseInt(row['magugpo_poblacion'] || row['magugpoPoblacion'] || '0') || 0,
    magugpo_south: parseInt(row['magugpo_south'] || row['magugpoSouth'] || '0') || 0,
    magugpo_west: parseInt(row['magugpo_west'] || row['magugpoWest'] || '0') || 0,
    mankilam: parseInt(row['mankilam'] || '0') || 0,
    new_balamban: parseInt(row['new_balamban'] || row['newBalamban'] || '0') || 0,
    nueva_fuerza: parseInt(row['nueva_fuerza'] || row['nuevaFuerza'] || '0') || 0,
    pagsabangan: parseInt(row['pagsabangan'] || '0') || 0,
    pandapan: parseInt(row['pandapan'] || '0') || 0,
    san_agustin: parseInt(row['san_agustin'] || row['sanAgustin'] || '0') || 0,
    san_isidro: parseInt(row['san_isidro'] || row['sanIsidro'] || '0') || 0,
    san_miguel: parseInt(row['san_miguel'] || row['sanMiguel'] || '0') || 0,
    visayan_village: parseInt(row['visayan_village'] || row['visayanVillage'] || '0') || 0,
    outside_tagum: parseInt(row['outside_tagum'] || row['outsideTagum'] || '0') || 0,
  }));
};

/**
 * Handle CSV file import
 */
export const importCSV = (file: File, userId: string, userName: string): Promise<MEALRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        const mealRecords = convertToMEALRecord(parsedData, userId, userName);
        resolve(mealRecords);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

