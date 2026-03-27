import { MEALRecord, MEALAnalyticsData } from '../types/meal';

// ─── Analytics Calculator ──────────────────────────────────────────────────

export const calculateAnalytics = (records: MEALRecord[]): MEALAnalyticsData => {
  const validRecords = records || [];

  const barangayFields: (keyof MEALRecord)[] = [
    'apokon', 'bincungan', 'busaon', 'canocotan', 'cuambogan',
    'la_filipina', 'liboganon', 'madaum', 'magdum', 'magugpo_east',
    'magugpo_north', 'magugpo_poblacion', 'magugpo_south', 'magugpo_west',
    'mankilam', 'new_balamban', 'nueva_fuerza', 'pagsabangan', 'pandapan',
    'san_agustin', 'san_isidro', 'san_miguel', 'visayan_village', 'outside_tagum',
  ];

  const barangayLabels: Record<string, string> = {
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
    outside_tagum: 'Outside Tagum',
  };

  const barangayMap = new Map<string, number>();
  validRecords.forEach(record => {
    barangayFields.forEach(field => {
      const value = (record[field] as number) || 0;
      if (value > 0) barangayMap.set(field as string, (barangayMap.get(field as string) || 0) + value);
    });
  });

  const barangayData = Array.from(barangayMap.entries())
    .map(([key, value]) => ({ name: barangayLabels[key] || key, value }))
    .sort((a, b) => b.value - a.value);

  const ppaTypeMap = new Map<string, number>();
  validRecords.forEach(r => {
    const t = r.ppa_type || 'Unknown';
    ppaTypeMap.set(t, (ppaTypeMap.get(t) || 0) + 1);
  });
  const ppaClassification = Array.from(ppaTypeMap.entries()).map(([name, value]) => ({ name, value }));

  const totalMale   = validRecords.reduce((s, r) => s + (r.male || 0), 0);
  const totalFemale = validRecords.reduce((s, r) => s + (r.female || 0), 0);
  const genderData  = [{ name: 'Male', value: totalMale }, { name: 'Female', value: totalFemale }];

  const ageDistribution = [
    { age: 'Below 14', count: validRecords.reduce((s, r) => s + (r.age_below_14 || 0), 0) },
    { age: '15-17',    count: validRecords.reduce((s, r) => s + (r.age_15_17 || 0), 0) },
    { age: '18-24',    count: validRecords.reduce((s, r) => s + (r.age_18_24 || 0), 0) },
    { age: '25-30',    count: validRecords.reduce((s, r) => s + (r.age_25_30 || 0), 0) },
    { age: '30+',      count: validRecords.reduce((s, r) => s + (r.age_30_and_above || 0), 0) },
  ];

  const sdgMap = new Map<string, number>();
  validRecords.forEach(r => { const g = r.sdg_goal || 'Unknown'; sdgMap.set(g, (sdgMap.get(g) || 0) + 1); });
  const sdgGoals = Array.from(sdgMap.entries()).map(([goal, count]) => ({ goal, count })).sort((a, b) => b.count - a.count);

  const currentYear = new Date().getFullYear();
  const monthlyImplementations = new Array(12).fill(0);
  const monthlyParticipants    = new Array(12).fill(0);
  validRecords.forEach(r => {
    if (r.start_date) {
      const d = new Date(r.start_date);
      if (d.getFullYear() === currentYear) {
        monthlyImplementations[d.getMonth()]++;
        monthlyParticipants[d.getMonth()] += r.actual_attendees || 0;
      }
    }
  });
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = monthNames.map((month, i) => ({
    month,
    implementations: monthlyImplementations[i],
    participants: monthlyParticipants[i],
  }));

  const totalRecords           = validRecords.length;
  const totalBeneficiaries     = validRecords.reduce((s, r) => s + (r.actual_attendees || 0), 0);
  const totalBudget            = validRecords.reduce((s, r) => s + (r.budget_allocated || 0), 0);
  const utilizedBudget         = validRecords.reduce((s, r) => s + (r.budget_utilized || 0), 0);
  const averageBudgetUtilization = totalBudget > 0 ? Math.round((utilizedBudget / totalBudget) * 100) : 0;

  return { barangayData, monthlyData, ppaClassification, genderData, ageDistribution, sdgGoals, totalRecords, totalBeneficiaries, averageBudgetUtilization };
};

// ─── SVG Chart Helpers ─────────────────────────────────────────────────────

const PALETTE    = ['#177d49','#22c55e','#16a34a','#15803d','#0d9488','#0891b2','#6d28d9','#db2777','#ea580c','#ca8a04'];
const PIE_COLORS = ['#177d49','#16a34a','#0d9488','#0891b2','#6d28d9','#db2777','#ea580c','#ca8a04','#b45309','#64748b'];

function svgHorizontalBar(data: { name: string; value: number }[], width = 620, rowH = 28): string {
  if (!data.length) return '<p style="color:#999;font-style:italic">No data available.</p>';
  const max  = Math.max(...data.map(d => d.value), 1);
  const barW = width - 185;
  const h    = data.length * rowH + 20;
  const bars = data.map((d, i) => {
    const fill = PALETTE[i % PALETTE.length];
    const bw   = Math.max(2, Math.round((d.value / max) * barW));
    const y    = i * rowH + 10;
    const lbl  = d.name.length > 19 ? d.name.slice(0, 18) + '…' : d.name;
    return `
      <text x="0" y="${y + 9}" font-size="11" fill="#374151">${lbl}</text>
      <rect x="168" y="${y}" width="${bw}" height="${rowH - 8}" rx="3" fill="${fill}" opacity="0.85"/>
      <text x="${168 + bw + 4}" y="${y + 9}" font-size="10" fill="#374151">${d.value.toLocaleString()}</text>`;
  }).join('');
  return `<svg width="${width}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">${bars}</svg>`;
}

function svgPie(data: { name: string; value: number }[], size = 170): string {
  if (!data.length) return '<p style="color:#999;font-style:italic">No data available.</p>';
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return '<p style="color:#999;font-style:italic">No data available.</p>';
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
    return `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${PIE_COLORS[i % PIE_COLORS.length]}" stroke="white" stroke-width="2"/>`;
  }).join('');
  const legend = data.map((d, i) => {
    const pct = ((d.value / total) * 100).toFixed(1);
    return `<div style="display:flex;align-items:center;gap:5px;margin:3px 0;font-size:11px">
      <span style="width:11px;height:11px;border-radius:2px;background:${PIE_COLORS[i % PIE_COLORS.length]};flex-shrink:0"></span>
      <span style="color:#374151">${d.name}: <b>${d.value}</b> (${pct}%)</span></div>`;
  }).join('');
  return `<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${slices}</svg>
    <div>${legend}</div></div>`;
}

function svgLineBar(
  data: { month: string; implementations: number; participants: number }[],
  width = 620
): string {
  if (!data.length) return '<p style="color:#999;font-style:italic">No data available.</p>';
  const h = 150, padL = 38, padB = 26, padR = 14, padT = 8;
  const innerW = width - padL - padR;
  const innerH = h - padB - padT;
  const maxImpl = Math.max(...data.map(d => d.implementations), 1);
  const maxPart = Math.max(...data.map(d => d.participants), 1);
  const step = innerW / data.length;
  const barW = Math.max(4, Math.floor(step) - 5);

  const bars = data.map((d, i) => {
    const x  = padL + i * step + (step - barW) / 2;
    const bh = Math.max(1, (d.implementations / maxImpl) * innerH);
    const y  = padT + innerH - bh;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}" rx="2" fill="#177d49" opacity="0.75"/>`;
  }).join('');

  const linePoints = data.map((d, i) => {
    const x = padL + (i + 0.5) * step;
    const y = padT + innerH - (d.participants / maxPart) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const dots = data.map((d, i) => {
    const x = padL + (i + 0.5) * step;
    const y = padT + innerH - (d.participants / maxPart) * innerH;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#15803d" stroke="white" stroke-width="1.5"/>`;
  }).join('');

  const xlabels = data.map((d, i) => {
    const x = padL + (i + 0.5) * step;
    return `<text x="${x.toFixed(1)}" y="${h - 4}" text-anchor="middle" font-size="9" fill="#6b7280">${d.month}</text>`;
  }).join('');

  // Y-axis ticks (impl side)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const val = Math.round(maxImpl * t);
    const y   = padT + innerH - t * innerH;
    return `<text x="${padL - 4}" y="${y.toFixed(1)}" text-anchor="end" font-size="8" fill="#9ca3af" dominant-baseline="middle">${val}</text>
            <line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="#f3f4f6" stroke-width="1"/>`;
  }).join('');

  return `<div>
    <div style="display:flex;gap:16px;margin-bottom:5px;font-size:10px;color:#4b5563">
      <span style="display:flex;align-items:center;gap:4px">
        <span style="width:12px;height:10px;background:#177d49;opacity:.75;display:inline-block;border-radius:2px"></span>Implementations (bars)
      </span>
      <span style="display:flex;align-items:center;gap:4px">
        <span style="width:20px;height:2px;background:#15803d;display:inline-block"></span>Participants (line)
      </span>
    </div>
    <svg width="${width}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      ${yTicks}
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + innerH}" stroke="#d1d5db" stroke-width="1"/>
      <line x1="${padL}" y1="${padT + innerH}" x2="${width - padR}" y2="${padT + innerH}" stroke="#d1d5db" stroke-width="1"/>
      ${bars}
      <polyline points="${linePoints}" fill="none" stroke="#15803d" stroke-width="2" stroke-linejoin="round"/>
      ${dots}
      ${xlabels}
    </svg>
  </div>`;
}

function svgAgeBar(data: { age: string; count: number }[], width = 300): string {
  if (!data.length) return '<p style="color:#999;font-style:italic">No data available.</p>';
  const h = 140, padL = 10, padB = 26, padT = 20, padR = 10;
  const innerW = width - padL - padR;
  const innerH = h - padB - padT;
  const max    = Math.max(...data.map(d => d.count), 1);
  const step   = innerW / data.length;
  const barW   = Math.max(4, Math.floor(step) - 8);

  const bars = data.map((d, i) => {
    const x  = padL + i * step + (step - barW) / 2;
    const bh = Math.max(1, (d.count / max) * innerH);
    const y  = padT + innerH - bh;
    const fill = PALETTE[i % PALETTE.length];
    return `
      <rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${barW}" height="${bh.toFixed(0)}" rx="3" fill="${fill}"/>
      <text x="${(x + barW / 2).toFixed(0)}" y="${(y - 4).toFixed(0)}" text-anchor="middle" font-size="9" fill="#374151">${d.count}</text>
      <text x="${(x + barW / 2).toFixed(0)}" y="${h - 4}" text-anchor="middle" font-size="9" fill="#6b7280">${d.age}</text>`;
  }).join('');

  return `<svg width="${width}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${padL}" y1="${padT + innerH}" x2="${width - padR}" y2="${padT + innerH}" stroke="#d1d5db" stroke-width="1"/>
    ${bars}
  </svg>`;
}

// ─── Full HTML Report ──────────────────────────────────────────────────────

function buildReportHTML(analytics: MEALAnalyticsData, records: MEALRecord[]): string {
  const now    = new Date();
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const year   = now.getFullYear();

  const totalBudget  = records.reduce((s, r) => s + (r.budget_allocated || 0), 0);
  const usedBudget   = records.reduce((s, r) => s + (r.budget_utilized || 0), 0);
  const lgbtqia      = records.reduce((s, r) => s + (r.lgbtqia || 0), 0);
  const osy          = records.reduce((s, r) => s + (r.out_of_school_youth || 0), 0);
  const ip           = records.reduce((s, r) => s + (r.indigenous_people || 0), 0);
  const pwd          = records.reduce((s, r) => s + (r.persons_with_disability || 0), 0);
  const fourPs       = records.reduce((s, r) => s + (r.four_ps || 0), 0);
  const muslim       = records.reduce((s, r) => s + (r.muslim || 0), 0);
  const sk           = records.reduce((s, r) => s + (r.sangguniang_kabataan || 0), 0);
  const lydc         = records.reduce((s, r) => s + (r.lydc || 0), 0);
  const barangayFull = [...analytics.barangayData];
  const barangayTop  = barangayFull.slice(0, 12);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>TCYDO MEAL Analytics Report — ${dateStr}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; font-size: 13px; line-height: 1.45; }
  .page { width: 210mm; margin: 0 auto; padding: 14mm 14mm 12mm; }

  @media print {
    @page { size: A4; margin: 12mm 14mm; }
    body  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 100%; padding: 0; }
    .no-break { page-break-inside: avoid; }
    .pg-break  { page-break-before: always; margin-top: 12mm; }
  }

  /* Header */
  .hdr { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #177d49; padding-bottom: 11px; margin-bottom: 16px; }
  .hdr-icon { width: 48px; height: 48px; background: #177d49; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .hdr-icon svg { width: 28px; height: 28px; fill: none; stroke: white; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .hdr-text h1 { font-size: 19px; font-weight: 700; color: #177d49; }
  .hdr-text p  { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .hdr-meta { margin-left: auto; text-align: right; font-size: 11px; color: #6b7280; }
  .hdr-meta strong { display: block; font-size: 12px; color: #374151; font-weight: 600; }

  /* KPI strip */
  .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin-bottom: 14px; }
  .kpi { border-radius: 10px; padding: 11px 12px; text-align: center; border: 1px solid transparent; }
  .kpi .val { font-size: 24px; font-weight: 800; line-height: 1; }
  .kpi .lbl { font-size: 9.5px; text-transform: uppercase; letter-spacing: .05em; margin-top: 4px; color: #4b5563; }
  .kpi.green  { background: linear-gradient(135deg,#f0fdf4,#dcfce7); border-color: #bbf7d0; }
  .kpi.green .val { color: #15803d; }
  .kpi.blue   { background: linear-gradient(135deg,#eff6ff,#dbeafe); border-color: #bfdbfe; }
  .kpi.blue .val  { color: #1d4ed8; }
  .kpi.amber  { background: linear-gradient(135deg,#fffbeb,#fef3c7); border-color: #fde68a; }
  .kpi.amber .val { color: #d97706; }
  .kpi.rose   { background: linear-gradient(135deg,#fff1f2,#ffe4e6); border-color: #fecdd3; }
  .kpi.rose .val  { color: #e11d48; }

  /* Budget bar */
  .bud { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 11px 15px; margin-bottom: 14px; }
  .bud h3 { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 7px; }
  .bud-bg { background: #e5e7eb; border-radius: 99px; height: 13px; overflow: hidden; }
  .bud-fg { background: linear-gradient(90deg,#177d49,#22c55e); height: 100%; border-radius: 99px; }
  .bud-nums { display: flex; justify-content: space-between; font-size: 10.5px; color: #6b7280; margin-top: 4px; }

  /* Two-col */
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .full { margin-bottom: 14px; }

  /* Card */
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 11px 13px; }
  .card-t { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; }

  /* Vulnerable grid */
  .vg { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin-top: 4px; }
  .vg-item { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 7px 9px; text-align: center; }
  .vg-item .v { font-size: 18px; font-weight: 800; color: #15803d; }
  .vg-item .l { font-size: 9.5px; color: #4b5563; margin-top: 2px; }

  /* Section heading */
  .sec-title { font-size: 14px; font-weight: 700; color: #177d49; border-left: 4px solid #177d49; padding-left: 8px; margin-bottom: 9px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #177d49; color: white; padding: 6px 9px; text-align: left; font-weight: 600; }
  td { padding: 5px 9px; border-bottom: 1px solid #f3f4f6; }
  tr:nth-child(even) td { background: #f9fafb; }
  .rnk { color: #9ca3af; font-size: 10px; }
  .mini { display: inline-block; background: #177d49; height: 8px; border-radius: 2px; vertical-align: middle; opacity: .7; }
  .tot td { background: #f0fdf4 !important; font-weight: 700; }

  /* Footer */
  .ftr { margin-top: 18px; border-top: 1px solid #e5e7eb; padding-top: 9px; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
</style>
</head>
<body>
<div class="page">

<!-- ── HEADER ─────────────────────────────────────────────── -->
<div class="hdr">
  <div class="hdr-icon">
    <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  </div>
  <div class="hdr-text">
    <h1>TCYDO MEAL Analytics Report</h1>
    <p>Tagum City Youth Development Office — Monitoring, Evaluation, Accountability &amp; Learning</p>
  </div>
  <div class="hdr-meta">
    <strong>${dateStr}</strong>
    Report Year: ${year}
  </div>
</div>

<!-- ── KPI STRIP ──────────────────────────────────────────── -->
<div class="kpi-row">
  <div class="kpi green"><div class="val">${analytics.totalRecords}</div><div class="lbl">Total Reports</div></div>
  <div class="kpi blue"><div class="val">${analytics.totalBeneficiaries.toLocaleString()}</div><div class="lbl">Beneficiaries</div></div>
  <div class="kpi amber"><div class="val">${analytics.averageBudgetUtilization}%</div><div class="lbl">Budget Utilization</div></div>
  <div class="kpi rose"><div class="val">${analytics.barangayData.length}</div><div class="lbl">Barangays Covered</div></div>
</div>

<!-- ── BUDGET BAR ─────────────────────────────────────────── -->
<div class="bud no-break">
  <h3>Budget Overview — Allocated vs. Utilized</h3>
  <div class="bud-bg"><div class="bud-fg" style="width:${Math.min(analytics.averageBudgetUtilization, 100)}%"></div></div>
  <div class="bud-nums">
    <span>₱${usedBudget.toLocaleString()} utilized</span>
    <span>${analytics.averageBudgetUtilization}% of ₱${totalBudget.toLocaleString()} allocated</span>
  </div>
</div>

<!-- ── MONTHLY TREND (full-width) ────────────────────────── -->
<div class="full card no-break">
  <div class="card-t">Monthly Implementation Trend — ${year}</div>
  ${svgLineBar(analytics.monthlyData, 620)}
</div>

<!-- ── PPA + GENDER ──────────────────────────────────────── -->
<div class="two no-break">
  <div class="card"><div class="card-t">PPA Classification</div>${svgPie(analytics.ppaClassification, 160)}</div>
  <div class="card"><div class="card-t">Gender Distribution</div>${svgPie(analytics.genderData, 160)}</div>
</div>

<!-- ── AGE + VULNERABLE ──────────────────────────────────── -->
<div class="two no-break">
  <div class="card"><div class="card-t">Age Group Distribution</div>${svgAgeBar(analytics.ageDistribution, 285)}</div>
  <div class="card">
    <div class="card-t">Supplementary Data</div>
    <div class="vg">
      <div class="vg-item"><div class="v">${lgbtqia.toLocaleString()}</div><div class="l">LGBTQIA+</div></div>
      <div class="vg-item"><div class="v">${osy.toLocaleString()}</div><div class="l">Out-of-School Youth</div></div>
      <div class="vg-item"><div class="v">${ip.toLocaleString()}</div><div class="l">Indigenous People</div></div>
      <div class="vg-item"><div class="v">${pwd.toLocaleString()}</div><div class="l">Persons w/ Disability</div></div>
      <div class="vg-item"><div class="v">${fourPs.toLocaleString()}</div><div class="l">4Ps Beneficiaries</div></div>
      <div class="vg-item"><div class="v">${muslim.toLocaleString()}</div><div class="l">Muslim</div></div>
      <div class="vg-item"><div class="v">${sk.toLocaleString()}</div><div class="l">Sangguniang Kabataan</div></div>
      <div class="vg-item"><div class="v">${lydc.toLocaleString()}</div><div class="l">LYDC</div></div>
    </div>
  </div>
</div>

<!-- ── PAGE 2 ─────────────────────────────────────────────── -->
<div class="pg-break"></div>

<!-- ── BARANGAY CHART ────────────────────────────────────── -->
<div class="full card no-break" style="margin-bottom:14px">
  <div class="card-t">Top ${Math.min(12, barangayTop.length)} Barangays by Participant Count</div>
  ${svgHorizontalBar(barangayTop, 620, 28)}
</div>

<!-- ── BARANGAY TABLE ────────────────────────────────────── -->
<div class="full no-break" style="margin-bottom:14px">
  <div class="sec-title">Barangay Distribution — Complete Data</div>
  <table>
    <thead><tr><th style="width:34px">#</th><th>Barangay</th><th style="width:90px;text-align:right">Participants</th><th style="width:70px;text-align:right">Share</th><th style="width:150px">Visual</th></tr></thead>
    <tbody>
      ${(() => {
        const tot  = barangayFull.reduce((s, d) => s + d.value, 0) || 1;
        const maxV = Math.max(...barangayFull.map(d => d.value), 1);
        return barangayFull.map((d, i) => {
          const pct = ((d.value / tot) * 100).toFixed(1);
          const bw  = Math.round((d.value / maxV) * 130);
          return `<tr><td class="rnk">${i + 1}</td><td>${d.name}</td><td style="text-align:right;font-weight:600">${d.value.toLocaleString()}</td><td style="text-align:right">${pct}%</td><td><span class="mini" style="width:${bw}px"></span></td></tr>`;
        }).join('');
      })()}
    </tbody>
  </table>
</div>

<!-- ── SDG TABLE ─────────────────────────────────────────── -->
${analytics.sdgGoals.length ? `
<div class="full no-break" style="margin-bottom:14px">
  <div class="sec-title">Sustainable Development Goals (SDG) Alignment</div>
  <table>
    <thead><tr><th style="width:34px">#</th><th>SDG Goal</th><th style="width:80px;text-align:right">Reports</th><th style="width:70px;text-align:right">Share</th></tr></thead>
    <tbody>
      ${(() => {
        const tot = analytics.sdgGoals.reduce((s, d) => s + d.count, 0) || 1;
        return analytics.sdgGoals.map((d, i) => {
          const pct = ((d.count / tot) * 100).toFixed(1);
          return `<tr><td class="rnk">${i + 1}</td><td>${d.goal}</td><td style="text-align:right;font-weight:600">${d.count}</td><td style="text-align:right">${pct}%</td></tr>`;
        }).join('');
      })()}
    </tbody>
  </table>
</div>` : ''}

<!-- ── MONTHLY TABLE ─────────────────────────────────────── -->
<div class="full no-break">
  <div class="sec-title">Monthly Summary — ${year}</div>
  <table>
    <thead><tr><th>Month</th><th style="text-align:right">Implementations</th><th style="text-align:right">Total Participants</th></tr></thead>
    <tbody>
      ${analytics.monthlyData.map(d => `<tr><td>${d.month}</td><td style="text-align:right">${d.implementations}</td><td style="text-align:right">${d.participants.toLocaleString()}</td></tr>`).join('')}
      <tr class="tot">
        <td>TOTAL</td>
        <td style="text-align:right">${analytics.monthlyData.reduce((s, d) => s + d.implementations, 0)}</td>
        <td style="text-align:right">${analytics.monthlyData.reduce((s, d) => s + d.participants, 0).toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ── FOOTER ────────────────────────────────────────────── -->
<div class="ftr">
  <span>Tagum City Youth Development Office (TCYDO) — MEAL System</span>
  <span>Computer-generated document. No signature required. | ${dateStr}</span>
</div>

</div>
</body>
</html>`;
}

// ─── Public API ────────────────────────────────────────────────────────────

export const exportToPDF = async (
  records: MEALRecord[],
  analyticsData?: MEALAnalyticsData | null
): Promise<void> => {
  const analytics = analyticsData && analyticsData.totalRecords !== undefined
    ? analyticsData
    : calculateAnalytics(records || []);

  const html = buildReportHTML(analytics, records || []);

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.addEventListener('load', () => setTimeout(() => win.print(), 500));
  } else {
    // Popup blocked — download as HTML instead
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `TCYDO_MEAL_Report_${new Date().toISOString().slice(0, 10)}.html`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }
};
