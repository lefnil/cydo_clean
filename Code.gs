/**
 * Tagum City Youth Development Office (TCYDO) - MEAL & Reports Backend
 * Google Apps Script Web App
 */
// --- Configuration ---
function getJwtSecret() {
  var secret = PropertiesService.getScriptProperties().getProperty('JWT_SECRET');
if (!secret) throw new Error('JWT_SECRET is not set in Script Properties.');
return secret;
}
function getHashSecret() {
 var secret = PropertiesService.getScriptProperties().getProperty('HASH_SECRET');
if (!secret) throw new Error('HASH_SECRET is not set in Script Properties.');
return secret;
}

function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('API_KEY');
}

// --- JWT Functions ---
function createToken(user) {
  var JWT_SECRET = getJwtSecret();
  var header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({
    id: user.id,
    role: user.role,
    name: user.name,
    username: user.username,
    exp: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
  }));
  var signature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(header + '.' + payload, JWT_SECRET)
  );
  return header + '.' + payload + '.' + signature;
}

function verifyToken(token) {
  var JWT_SECRET = getJwtSecret();
  try {
    var parts = token.split('.');
    if (parts.length !== 3) return null;
    var expectedSig = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(parts[0] + '.' + parts[1], JWT_SECRET)
    );
    if (expectedSig !== parts[2]) return null; // tampered
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch (e) { return null; }
}

// --- Setup ---
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = [
    { name: 'users', headers: ['id', 'username', 'password', 'role', 'name', 'email', 'status', 'created_at'] },
    { name: 'sk_reports', headers: ['id', 'user_id', 'title', 'content', 'status', 'created_at', 'author_name'] },
    { name: 'lydc_reports', headers: ['id', 'user_id', 'title', 'content', 'status', 'created_at', 'author_name'] },
    { name: 'meal_records', headers: [
      // Core Fields
      'id', 'user_id', 'status', 'created_at', 'author_name',
      // PPA Details
      'ppa_name', 'ppa_type', 'start_date', 'end_date', 'center_of_participation',
      'sdg_goal', 'budget_allocated', 'budget_utilized',
      // Objectives
      'objective_1', 'objective_2', 'objective_3',
      // Attendance
      'expected_attendees', 'actual_attendees',
      // Gender
      'male', 'female',
      // Age Groups
      'age_below_14', 'age_15_17', 'age_18_24', 'age_25_30', 'age_30_and_above',
      // Vulnerable Groups
      'lgbtqia', 'out_of_school_youth', 'indigenous_people', 'muslim', 'four_ps', 'persons_with_disability',
      // Organization
      'sangguniang_kabataan', 'lydc',
      // Details
      'highlights', 'outputs', 'partnerships_built', 'challenges_encountered', 'recommendations',
      // Review
      'reviewer_notes',
      // Barangay Data (numerical)
      'apokon', 'bincungan', 'busaon', 'canocotan', 'cuambogan',
      'la_filipina', 'liboganon', 'madaum', 'magdum', 'magugpo_east',
      'magugpo_north', 'magugpo_poblacion', 'magugpo_south', 'magugpo_west',
      'mankilam', 'new_balamban', 'nueva_fuerza', 'pagsabangan', 'pandapan',
      'san_agustin', 'san_isidro', 'san_miguel', 'visayan_village', 'outside_tagum'
    ]},
    { name: 'activities', headers: ['id', 'activity_name', 'assigned_to', 'submission_deadline', 'reported_status', 'created_at'] },
    { name: 'audit_logs', headers: ['id', 'user_id', 'action', 'details', 'created_at', 'username'] }
  ];

  sheets.forEach(function(s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      sheet.setFrozenRows(1);
    }
  });

  // Seed default users if empty
  var userSheet = ss.getSheetByName('users');
  if (userSheet.getLastRow() <= 1) {
    var now = new Date().toISOString();
    userSheet.appendRow([generateId(), 'admin', hashPassword('admin123'), 'admin', 'System Administrator', 'admin@tcydo.gov', 'active', now]);
    userSheet.appendRow([generateId(), 'sk_user', hashPassword('sk123'), 'sk', 'SK Representative', 'sk@barangay.gov', 'active', now]);
    userSheet.appendRow([generateId(), 'lydc_user', hashPassword('lydc123'), 'lydc', 'LYDC Representative', 'lydc@tcydo.gov', 'active', now]);
    userSheet.appendRow([generateId(), 'staff1', hashPassword('staff123'), 'staff', 'John Doe', 'john@tcydo.gov', 'active', now]);
    userSheet.appendRow([generateId(), 'staff2', hashPassword('staff123'), 'staff', 'Jane Smith', 'jane@tcydo.gov', 'active', now]);
  }

  // Seed default activities if empty
  var activitySheet = ss.getSheetByName('activities');
  if (activitySheet.getLastRow() <= 1) {
    var now = new Date().toISOString();
    activitySheet.appendRow([generateId(), 'Q4 Youth Summit Coordination', 'John Doe', '2026-12-15', 'pending', now]);
    activitySheet.appendRow([generateId(), 'Barangay Leadership Training', 'Jane Smith', '2026-12-20', 'in_progress', now]);
    activitySheet.appendRow([generateId(), 'Skills Development Program', 'Mike Johnson', '2026-12-10', 'submitted', now]);
    activitySheet.appendRow([generateId(), 'Community Outreach Initiative', 'Sarah Lee', '2026-12-05', 'overdue', now]);
    activitySheet.appendRow([generateId(), 'Youth Entrepreneurship Workshop', 'Tom Brown', '2026-12-25', 'approved', now]);
  }
}

// --- Main Request Handler ---
function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    
    // 1. GLOBAL API KEY CHECK (optional - only if configured)
    var configuredApiKey = getApiKey();
    if (configuredApiKey && params.apiKey !== configuredApiKey) {
      return respond({ error: 'Forbidden: Invalid API Key.' });
    }

    // 2. PUBLIC ACTIONS (No session token required)
    if (action === 'login') {
      var loginResult = login(params.username, params.password);
      if (loginResult.success) {
        loginResult.token = createToken(loginResult.user); // Generate session token
      }
      return respond(loginResult);
    }

    // 3. PRIVATE ACTIONS (Session token verification required)
    var currentUser = verifyToken(params.token);
    if (!currentUser) {
      return respond({ error: 'Unauthorized: Invalid or expired session.' });
    }

    // 4. FEATURE ROUTING
    var result = {};

    switch (action) {
      // SK Reports
      case 'get_sk_reports':
        result = getReports('sk_reports', currentUser.id, currentUser.role);
        break;
      case 'create_sk_report':
        result = createReport('sk_reports', params, currentUser);
        break;
      case 'update_sk_report_status':
        result = updateReportStatus('sk_reports', params.id, params.status, currentUser);
        break;
      
      // LYDC Reports
      case 'get_lydc_reports':
        result = getReports('lydc_reports', currentUser.id, currentUser.role);
        break;
      case 'create_lydc_report':
        result = createReport('lydc_reports', params, currentUser);
        break;
      case 'update_lydc_report_status':
        result = updateReportStatus('lydc_reports', params.id, params.status, currentUser);
        break;

      // MEAL Records
      case 'get_meal_records':
        result = getMealRecords(params, currentUser);
        break;
      case 'create_meal_record':
        result = createMealRecord(params, currentUser);
        break;
      case 'update_meal_record':
        result = updateMealRecord(params, currentUser);
        break;
      case 'delete_meal_record':
        result = deleteMealRecord(params.id, currentUser);
        break;
      case 'update_meal_status':
        result = updateMealStatus(params.id, params.status, currentUser);
        break;

      // Activities
      case 'get_activities':
        result = getActivities();
        break;
      case 'create_activity':
        result = createActivity(params, currentUser);
        break;
      case 'update_activity':
        result = updateActivity(params, currentUser);
        break;
      case 'delete_activity':
        result = deleteActivity(params.id, currentUser);
        break;

      // Users (Admin)
      case 'get_users':
        result = getUsers();
        break;
      case 'create_user':
        result = createUser(params, currentUser);
        break;
      case 'update_user':
        result = updateUser(params, currentUser);
        break;
      case 'delete_user':
        result = deleteUser(params.id, currentUser);
        break;

      // Analytics
      case 'get_analytics':
        result = getAnalytics();
        break;
      case 'get_meal_analytics':
        result = getMealAnalytics();
        break;
      case 'get_dashboard_stats':
      // Query sheets for real data:
        var pendingSK = countPendingReports('sk_reports'); // e.g. count status='pending'
        var pendingLYDC = countPendingReports('lydc_reports');
        var councils = getActiveCouncilsCount();
        var recentActivities = getRecentActivities(7); // last 7 days
        var chartData = getMonthlyChartData(); // aggregate last 6 months
        result = { pendingSK, pendingLYDC, councils, recentActivities, chartData };
        break;
      
      // Audit Logs
      case 'get_audit_logs':
        result = getTableData('audit_logs').reverse().slice(0, 100);
        break;
        
      case 'reset_password':
        result = resetUserPassword(params.id, params.new_password, currentUser);
        break;
      default:

        throw new Error("Unknown action: " + action);
    }

    return respond(result);

  } catch (error) {
    return respond({ error: error.message });
  }
}

/**
 * Helper to standardize JSON responses
 */
function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("TCYDO Backend is running. Please use POST requests.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// --- Authentication ---

function login(username, password) {
  var users = getTableData('users');
  
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username && verifyPassword(password, users[i].password)) {
      if (users[i].status !== 'active') {
        return { success: false, error: "Account is inactive" };
      }
      logAction(users[i].id, users[i].username, 'LOGIN_SUCCESS', 'User logged in');
      return {
        success: true,
        user: {
          id: users[i].id,
          username: users[i].username,
          role: users[i].role,
          name: users[i].name
        }
      };
    }
  }
  
  logAction('system', 'system', 'LOGIN_FAILED', 'Failed login attempt for: ' + username);
  return { success: false, error: "Invalid credentials" };
}

// --- Reports ---

function getReports(sheetName, userId, role) {
  var reports = getTableData(sheetName);
  if (role !== 'admin' && role !== 'office_head') {
    reports = reports.filter(function(r) { return r.user_id === userId; });
  }
  return reports.reverse();
}

function createReport(sheetName, params, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var id = generateId();
  var now = new Date().toISOString();
  
  sheet.appendRow([
    id, 
    params.user_id || user.id, 
    params.title, 
    params.content, 
    params.status || 'pending',
    now,
    params.author_name || user.name
  ]);
  
  logAction(user.id, user.name, 'CREATE_REPORT', 'Created report in ' + sheetName);
  return { id: id, status: 'pending' };
}

function updateReportStatus(sheetName, id, status, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      logAction(user.id, user.name, 'UPDATE_REPORT_STATUS', 'Updated report ' + id + ' status to ' + status);
      return { id: id, status: status };
    }
  }
  throw new Error("Report not found");
}

// --- MEAL Records ---

function getMealRecords(params, user) {
  var records = getTableData('meal_records');
  var userId = user.id;
  var role = user.role;
  
  // Filter by user for non-admin
  if (role !== 'admin' && role !== 'office_head' && role !== 'meal_head') {
    records = records.filter(function(r) { return r.user_id === userId; });
  }
  
  // Filter by status if provided
  if (params.status) {
    records = records.filter(function(r) { return r.status === params.status; });
  }
  
  return records.reverse();
}

function createMealRecord(params, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meal_records');
  var id = generateId();
  var now = new Date().toISOString();
  
  sheet.appendRow([
    // Core Fields
    id, 
    params.user_id || user.id, 
    params.status || 'pending',
    now,
    params.author_name || user.name,
    // PPA Details
    params.ppa_name || '',
    params.ppa_type || '',
    params.start_date || '',
    params.end_date || '',
    params.center_of_participation || '',
    params.sdg_goal || '',
    parseFloat(params.budget_allocated) || 0,
    parseFloat(params.budget_utilized) || 0,
    // Objectives
    params.objective_1 || '',
    params.objective_2 || '',
    params.objective_3 || '',
    // Attendance
    parseInt(params.expected_attendees) || 0,
    parseInt(params.actual_attendees) || 0,
    // Gender
    parseInt(params.male) || 0,
    parseInt(params.female) || 0,
    // Age Groups
    parseInt(params.age_below_14) || 0,
    parseInt(params.age_15_17) || 0,
    parseInt(params.age_18_24) || 0,
    parseInt(params.age_25_30) || 0,
    parseInt(params.age_30_and_above) || 0,
    // Vulnerable Groups
    parseInt(params.lgbtqia) || 0,
    parseInt(params.out_of_school_youth) || 0,
    parseInt(params.indigenous_people) || 0,
    parseInt(params.muslim) || 0,
    parseInt(params.four_ps) || 0,
    parseInt(params.persons_with_disability) || 0,
    // Organization
    params.sangguniang_kabataan || '',
    params.lydc || '',
    // Details
    params.highlights || '',
    params.outputs || '',
    params.partnerships_built || '',
    params.challenges_encountered || '',
    params.recommendations || '',
    // Review
    params.reviewer_notes || '',
    // Barangay Data (numerical)
    parseInt(params.apokon) || 0,
    parseInt(params.bincungan) || 0,
    parseInt(params.busaon) || 0,
    parseInt(params.canocotan) || 0,
    parseInt(params.cuambogan) || 0,
    parseInt(params.la_filipina) || 0,
    parseInt(params.liboganon) || 0,
    parseInt(params.madaum) || 0,
    parseInt(params.magdum) || 0,
    parseInt(params.magugpo_east) || 0,
    parseInt(params.magugpo_north) || 0,
    parseInt(params.magugpo_poblacion) || 0,
    parseInt(params.magugpo_south) || 0,
    parseInt(params.magugpo_west) || 0,
    parseInt(params.mankilam) || 0,
    parseInt(params.new_balamban) || 0,
    parseInt(params.nueva_fuerza) || 0,
    parseInt(params.pagsabangan) || 0,
    parseInt(params.pandapan) || 0,
    parseInt(params.san_agustin) || 0,
    parseInt(params.san_isidro) || 0,
    parseInt(params.san_miguel) || 0,
    parseInt(params.visayan_village) || 0,
    parseInt(params.outside_tagum) || 0
  ]);
  
  logAction(user.id, user.name, 'CREATE_MEAL_RECORD', 'Created MEAL record: ' + params.ppa_name);
  return { id: id, status: 'pending' };
}

function updateMealRecord(params, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meal_records');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  
  var fieldMap = {
    // PPA Details
    'ppa_name': 'ppa_name',
    'ppa_type': 'ppa_type',
    'start_date': 'start_date',
    'end_date': 'end_date',
    'center_of_participation': 'center_of_participation',
    'sdg_goal': 'sdg_goal',
    'budget_allocated': 'budget_allocated',
    'budget_utilized': 'budget_utilized',
    // Objectives
    'objective_1': 'objective_1',
    'objective_2': 'objective_2',
    'objective_3': 'objective_3',
    // Attendance
    'expected_attendees': 'expected_attendees',
    'actual_attendees': 'actual_attendees',
    // Gender
    'male': 'male',
    'female': 'female',
    // Age Groups
    'age_below_14': 'age_below_14',
    'age_15_17': 'age_15_17',
    'age_18_24': 'age_18_24',
    'age_25_30': 'age_25_30',
    'age_30_and_above': 'age_30_and_above',
    // Vulnerable Groups
    'lgbtqia': 'lgbtqia',
    'out_of_school_youth': 'out_of_school_youth',
    'indigenous_people': 'indigenous_people',
    'muslim': 'muslim',
    'four_ps': 'four_ps',
    'persons_with_disability': 'persons_with_disability',
    // Organization
    'sangguniang_kabataan': 'sangguniang_kabataan',
    'lydc': 'lydc',
    // Details
    'highlights': 'highlights',
    'outputs': 'outputs',
    'partnerships_built': 'partnerships_built',
    'challenges_encountered': 'challenges_encountered',
    'recommendations': 'recommendations',
    // Review
    'reviewer_notes': 'reviewer_notes',
    // Status
    'status': 'status',
    // Barangay Data (numerical)
    'apokon': 'apokon',
    'bincungan': 'bincungan',
    'busaon': 'busaon',
    'canocotan': 'canocotan',
    'cuambogan': 'cuambogan',
    'la_filipina': 'la_filipina',
    'liboganon': 'liboganon',
    'madaum': 'madaum',
    'magdum': 'magdum',
    'magugpo_east': 'magugpo_east',
    'magugpo_north': 'magugpo_north',
    'magugpo_poblacion': 'magugpo_poblacion',
    'magugpo_south': 'magugpo_south',
    'magugpo_west': 'magugpo_west',
    'mankilam': 'mankilam',
    'new_balamban': 'new_balamban',
    'nueva_fuerza': 'nueva_fuerza',
    'pagsabangan': 'pagsabangan',
    'pandapan': 'pandapan',
    'san_agustin': 'san_agustin',
    'san_isidro': 'san_isidro',
    'san_miguel': 'san_miguel',
    'visayan_village': 'visayan_village',
    'outside_tagum': 'outside_tagum'
  };
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === params.id) {
      for (var field in fieldMap) {
        if (params[field] !== undefined) {
          var colIdx = headers.indexOf(fieldMap[field]);
          if (colIdx >= 0) {
            sheet.getRange(i + 1, colIdx + 1).setValue(params[field]);
          }
        }
      }
      logAction(user.id, user.name, 'UPDATE_MEAL_RECORD', 'Updated MEAL record: ' + params.id);
      return { id: params.id };
    }
  }
  throw new Error("MEAL record not found");
}

function updateMealStatus(id, status, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meal_records');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      logAction(user.id, user.name, 'UPDATE_MEAL_STATUS', 'Updated MEAL record ' + id + ' status to ' + status);
      return { id: id, status: status };
    }
  }
  throw new Error("MEAL record not found");
}

function deleteMealRecord(id, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meal_records');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      logAction(user.id, user.name, 'DELETE_MEAL_RECORD', 'Deleted MEAL record: ' + id);
      return { id: id };
    }
  }
  throw new Error("MEAL record not found");
}

// --- Activities ---

function getActivities() {
  return getTableData('activities').reverse();
}

function createActivity(params, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('activities');
  var id = generateId();
  var now = new Date().toISOString();
  
  sheet.appendRow([
    id,
    params.activity_name,
    params.assigned_to,
    params.submission_deadline,
    params.reported_status || 'pending',
    now
  ]);
  
  logAction(user.id, user.name, 'CREATE_ACTIVITY', 'Created activity: ' + params.activity_name);
  return { id: id };
}

function updateActivity(params, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('activities');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  
  var fieldMap = {
    'activity_name': 'activity_name',
    'assigned_to': 'assigned_to',
    'submission_deadline': 'submission_deadline',
    'reported_status': 'reported_status'
  };
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === params.id) {
      for (var field in fieldMap) {
        if (params[field] !== undefined) {
          var colIdx = headers.indexOf(fieldMap[field]);
          if (colIdx >= 0) {
            sheet.getRange(i + 1, colIdx + 1).setValue(params[field]);
          }
        }
      }
      logAction(user.id, user.name, 'UPDATE_ACTIVITY', 'Updated activity: ' + params.id);
      return { id: params.id };
    }
  }
  throw new Error("Activity not found");
}

function deleteActivity(id, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('activities');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      logAction(user.id, user.name, 'DELETE_ACTIVITY', 'Deleted activity: ' + id);
      return { id: id };
    }
  }
  throw new Error("Activity not found");
}

// --- Users (Admin) ---

function getUsers() {
  return getTableData('users');
}

function createUser(params, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
  var id = generateId();
  var now = new Date().toISOString();
  
  sheet.appendRow([
    id,
    params.username,
    hashPassword(params.password),
    params.role,
    params.name,
    params.email || '',
    params.status || 'active',
    now
  ]);
  
  logAction(user.id, user.name, 'CREATE_USER', 'Created user: ' + params.username);
  return { id: id };
}

function updateUser(params, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  
  var fieldMap = {
    'username': 'username',
    'name': 'name',
    'email': 'email',
    'role': 'role',
    'status': 'status'
  };
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === params.id) {
      for (var field in fieldMap) {
        if (params[field] !== undefined) {
          var colIdx = headers.indexOf(fieldMap[field]);
          if (colIdx >= 0) {
            sheet.getRange(i + 1, colIdx + 1).setValue(params[field]);
          }
        }
      }
      // Handle password update separately
      if (params.password) {
        var pwdCol = headers.indexOf('password');
        sheet.getRange(i + 1, pwdCol + 1).setValue(hashPassword(params.password));
      }
      logAction(user.id, user.name, 'UPDATE_USER', 'Updated user: ' + params.id);
      return { id: params.id };
    }
  }
  throw new Error("User not found");
}

function deleteUser(id, user) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      logAction(user.id, user.name, 'DELETE_USER', 'Deleted user: ' + id);
      return { id: id };
    }
  }
  throw new Error("User not found");
}

function resetUserPassword(id, newPassword, user) {
  if (user.role !== 'admin') {
    throw new Error("Unauthorized: Only administrators can reset passwords.");
  }
  if (!id || !newPassword) {
    throw new Error("User ID and new password are required.");
  }
  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var pwdCol = headers.indexOf('password');
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i + 1, pwdCol + 1).setValue(hashPassword(newPassword));
      logAction(user.id, user.name, 'RESET_PASSWORD', 'Reset password for user: ' + id);
      return { success: true, message: "Password reset successfully." };
    }
  }
  throw new Error("User not found");
}

// --- Analytics ---

function getAnalytics() {
  var skReports = getTableData('sk_reports');
  var lydcReports = getTableData('lydc_reports');
  var users = getTableData('users');
  
  var monthlyDataMap = {};
  
  function processReports(reports, type) {
    reports.forEach(function(r) {
      if (!r.created_at) return;
      var month = r.created_at.substring(0, 7);
      if (!monthlyDataMap[month]) {
        monthlyDataMap[month] = { sk: 0, lydc: 0 };
      }
      monthlyDataMap[month][type]++;
    });
  }
  
  processReports(skReports, 'sk');
  processReports(lydcReports, 'lydc');
  
  var monthlyData = [];
  for (var month in monthlyDataMap) {
    if (monthlyDataMap[month].sk > 0) monthlyData.push({ month: month, type: 'SK', count: monthlyDataMap[month].sk });
    if (monthlyDataMap[month].lydc > 0) monthlyData.push({ month: month, type: 'LYDC', count: monthlyDataMap[month].lydc });
  }
  
  monthlyData.sort(function(a, b) { return a.month.localeCompare(b.month); });
  
  return {
    summary: {
      skReports: skReports.length,
      lydcReports: lydcReports.length,
      totalUsers: users.length
    },
    monthlyData: monthlyData
  };
}

function getMealAnalytics() {
  var records = getTableData('meal_records');

  // ── Status breakdown ──────────────────────────────────────────────────────
  var statusCounts = {};
  records.forEach(function(r) {
    var s = r.status || 'pending';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  // ── Totals ────────────────────────────────────────────────────────────────
  var totalBeneficiaries = records.reduce(function(sum, r) {
    return sum + (parseInt(r.actual_attendees) || 0);
  }, 0);

  var totalBudgetAllocated = records.reduce(function(sum, r) {
    return sum + (parseFloat(r.budget_allocated) || 0);
  }, 0);

  var totalBudgetUtilized = records.reduce(function(sum, r) {
    return sum + (parseFloat(r.budget_utilized) || 0);
  }, 0);

  var avgBudgetUtilization = totalBudgetAllocated > 0
    ? Math.round((totalBudgetUtilized / totalBudgetAllocated) * 100)
    : 0;

  // ── Barangay distribution ───────────────────────────────────────────────
  var barangayFields = [
    'apokon', 'bincungan', 'busaon', 'canocotan', 'cuambogan',
    'la_filipina', 'liboganon', 'madaum', 'magdum', 'magugpo_east',
    'magugpo_north', 'magugpo_poblacion', 'magugpo_south', 'magugpo_west',
    'mankilam', 'new_balamban', 'nueva_fuerza', 'pagsabangan', 'pandapan',
    'san_agustin', 'san_isidro', 'san_miguel', 'visayan_village', 'outside_tagum'
  ];
  var barangayLabels = {
    apokon: 'Apokon', bincungan: 'Bincungan', busaon: 'Busaon',
    canocotan: 'Canocotan', cuambogan: 'Cuambogan', la_filipina: 'La Filipina',
    liboganon: 'Liboganon', madaum: 'Madaum', magdum: 'Magdum',
    magugpo_east: 'Magugpo East', magugpo_north: 'Magugpo North',
    magugpo_poblacion: 'Magugpo Poblacion', magugpo_south: 'Magugpo South',
    magugpo_west: 'Magugpo West', mankilam: 'Mankilam',
    new_balamban: 'New Balamban', nueva_fuerza: 'Nueva Fuerza',
    pagsabangan: 'Pagsabangan', pandapan: 'Pandapan',
    san_agustin: 'San Agustin', san_isidro: 'San Isidro',
    san_miguel: 'San Miguel', visayan_village: 'Visayan Village',
    outside_tagum: 'Outside Tagum'
  };
  var barangaySums = {};
  records.forEach(function(r) {
    barangayFields.forEach(function(field) {
      var v = parseInt(r[field]) || 0;
      if (v > 0) barangaySums[field] = (barangaySums[field] || 0) + v;
    });
  });
  var barangayData = Object.keys(barangaySums)
    .map(function(k) { return { name: barangayLabels[k] || k, value: barangaySums[k] }; })
    .sort(function(a, b) { return b.value - a.value; });

  // ── PPA type classification ───────────────────────────────────────────────
  var ppaCounts = {};
  records.forEach(function(r) {
    var t = r.ppa_type || 'Unknown';
    ppaCounts[t] = (ppaCounts[t] || 0) + 1;
  });
  var ppaClassification = Object.keys(ppaCounts).map(function(name) {
    return { name: name, value: ppaCounts[name] };
  });

  // ── Gender distribution ───────────────────────────────────────────────────
  var totalMale   = records.reduce(function(s, r) { return s + (parseInt(r.male)   || 0); }, 0);
  var totalFemale = records.reduce(function(s, r) { return s + (parseInt(r.female) || 0); }, 0);
  var genderData  = [
    { name: 'Male',   value: totalMale   },
    { name: 'Female', value: totalFemale }
  ];

  // ── Age distribution ──────────────────────────────────────────────────────
  var ageDistribution = [
    { age: 'Below 14', count: records.reduce(function(s,r){ return s+(parseInt(r.age_below_14)||0); }, 0) },
    { age: '15-17',    count: records.reduce(function(s,r){ return s+(parseInt(r.age_15_17)   ||0); }, 0) },
    { age: '18-24',    count: records.reduce(function(s,r){ return s+(parseInt(r.age_18_24)   ||0); }, 0) },
    { age: '25-30',    count: records.reduce(function(s,r){ return s+(parseInt(r.age_25_30)   ||0); }, 0) },
    { age: '30+',      count: records.reduce(function(s,r){ return s+(parseInt(r.age_30_and_above)||0); }, 0) }
  ];

  // ── SDG goals distribution ────────────────────────────────────────────────
  var sdgCounts = {};
  records.forEach(function(r) {
    var g = r.sdg_goal || 'Unknown';
    sdgCounts[g] = (sdgCounts[g] || 0) + 1;
  });
  var sdgGoals = Object.keys(sdgCounts)
    .map(function(goal) { return { goal: goal, count: sdgCounts[goal] }; })
    .sort(function(a, b) { return b.count - a.count; });

  // ── Monthly trend ─────────────────────────────────────────────────────────
  var currentYear = new Date().getFullYear();
  var monthlyImpl = new Array(12).fill(0);
  var monthlyPart = new Array(12).fill(0);
  records.forEach(function(r) {
    if (r.start_date) {
      var d = new Date(r.start_date);
      if (!isNaN(d) && d.getFullYear() === currentYear) {
        var m = d.getMonth();
        monthlyImpl[m]++;
        monthlyPart[m] += (parseInt(r.actual_attendees) || 0);
      }
    }
  });
  var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var monthlyData = monthNames.map(function(month, i) {
    return { month: month, implementations: monthlyImpl[i], participants: monthlyPart[i] };
  });

  // ── Vulnerable sectors ────────────────────────────────────────────────────
  var vulnerableGroups = {
    lgbtqia:              records.reduce(function(s,r){ return s+(parseInt(r.lgbtqia)              ||0); }, 0),
    out_of_school_youth:  records.reduce(function(s,r){ return s+(parseInt(r.out_of_school_youth)  ||0); }, 0),
    indigenous_people:    records.reduce(function(s,r){ return s+(parseInt(r.indigenous_people)    ||0); }, 0),
    muslim:               records.reduce(function(s,r){ return s+(parseInt(r.muslim)               ||0); }, 0),
    four_ps:              records.reduce(function(s,r){ return s+(parseInt(r.four_ps)              ||0); }, 0),
    persons_with_disability: records.reduce(function(s,r){ return s+(parseInt(r.persons_with_disability)||0); }, 0)
  };

  return {
    summary: {
      total:               records.length,
      pending:             statusCounts.pending      || 0,
      under_review:        statusCounts.under_review || 0,
      approved:            (statusCounts.approved    || 0) + (statusCounts.completed || 0),
      active:              statusCounts.active       || 0,
      totalBeneficiaries:  totalBeneficiaries,
      totalBudgetAllocated: totalBudgetAllocated,
      totalBudgetUtilized:  totalBudgetUtilized,
      avgBudgetUtilization: avgBudgetUtilization
    },
    statusBreakdown: Object.keys(statusCounts).map(function(name) {
      return { name: name, value: statusCounts[name] };
    }),
    barangayData:       barangayData,
    ppaClassification:  ppaClassification,
    genderData:         genderData,
    ageDistribution:    ageDistribution,
    sdgGoals:           sdgGoals,
    monthlyData:        monthlyData,
    vulnerableGroups:   vulnerableGroups,
    totalRecords:              records.length,
    totalBeneficiaries:        totalBeneficiaries,
    averageBudgetUtilization:  avgBudgetUtilization
  };
}

// --- Helpers ---

function getTableData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = data.slice(1);
  
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
}

function logAction(userId, username, action, details) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('audit_logs');
  if (sheet) {
    sheet.appendRow([
      generateId(),
      userId,
      action,
      details,
      new Date().toISOString(),
      username
    ]);
  }
}

// --- Password Functions ---

function hashPassword(password, salt) {
  var HASH_SECRET = getHashSecret();

  // Use provided salt (verification) or generate a new one (creation)
  if (!salt) {
    salt = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Math.random().toString())
    ).substring(0, 16);
  }

  var hash = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(password + salt, HASH_SECRET)
  );

  return salt + '$' + hash;
}

function verifyPassword(plaintext, stored) {
  if (!stored || !stored.includes('$')) {
    // Not in salt$hash format — reject.
    // Run migratePasswords() if you have legacy passwords.
    Logger.log('verifyPassword: hash not in salt$hash format. Run migratePasswords().');
    return false;
  }

  var parts = stored.split('$');
  var salt = parts[0];
  var expected = hashPassword(plaintext, salt);
  return expected === stored;
}


function generateId() {
  return Utilities.getUuid();
}