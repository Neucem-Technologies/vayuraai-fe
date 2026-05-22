export type Scope = "Scope 1" | "Scope 2" | "Scope 3";
export type UploadStatus = "Processing" | "Needs Review" | "Completed" | "Failed";
export type ConfidenceLevel = "high" | "medium" | "low";
export type ConsultantRole = "Partner" | "Manager" | "Consultant" | "Analyst";
export type SmeRole = "Owner" | "Approver" | "Contributor" | "Viewer";
export type UserType = "consultant" | "sme";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  firmRole?: ConsultantRole;
  smeRole?: SmeRole;
  company: string;
  avatar: string;
  userType: UserType;
  clientId?: string;
}

export const MOCK_FIRM = {
  id: "firm_1",
  name: "Greenedge Sustainability Advisors",
  shortName: "Greenedge",
  initials: "GE",
  plan: "Consultant — Pro",
  country: "India",
  website: "greenedge.in",
  billingEmail: "billing@greenedge.in",
};

export const MOCK_USER: AppUser = {
  id: "u_123",
  name: "Aisha Sharma",
  email: "aisha.s@greenedge.in",
  role: "Senior Consultant",
  firmRole: "Manager" as ConsultantRole,
  company: MOCK_FIRM.name,
  avatar: "AS",
  userType: "consultant",
};

export const MOCK_SME_USER: AppUser = {
  id: "u_sme_1",
  name: "Vivek Bhatia",
  email: "vivek.b@techcorp.in",
  role: "Head of Sustainability",
  smeRole: "Owner" as SmeRole,
  company: "TechCorp India Pvt Ltd",
  avatar: "VB",
  userType: "sme",
  clientId: "cl_1",
};

export interface ClientOrg {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  industry: string;
  country: string;
  fiscalYearStart: string;
  reportingStandard: "BRSR" | "GRI" | "BOTH";
  status: "Active" | "Onboarding" | "Paused";
  reportingStatus: "In Progress" | "Behind Schedule" | "Submitted" | "Setup" | "Final Review" | "Draft";
  primaryContact: { name: string; role: string; email: string };
  leadConsultant: string;
  totalEmissionsYTD: number;
  yoyDeltaPct: number;
  employees: number;
  facilitiesCount: number;
  dataSourcesActive: number;
  pendingItems: number;
  lastActivity: string;
  engagementSince: string;
}

export const MOCK_CLIENTS: ClientOrg[] = [
  {
    id: "cl_1",
    name: "TechCorp India Pvt Ltd",
    shortName: "TechCorp",
    initials: "TC",
    industry: "IT / ITES",
    country: "India",
    fiscalYearStart: "April",
    reportingStandard: "BRSR",
    status: "Active",
    reportingStatus: "In Progress",
    primaryContact: { name: "Vivek Bhatia", role: "Head of Sustainability", email: "vivek.b@techcorp.in" },
    leadConsultant: "Aisha Sharma",
    totalEmissionsYTD: 2731.4,
    yoyDeltaPct: -9.5,
    employees: 1705,
    facilitiesCount: 5,
    dataSourcesActive: 8,
    pendingItems: 12,
    lastActivity: "2 hours ago",
    engagementSince: "Jun 2023",
  },
  {
    id: "cl_2",
    name: "Sahyadri Cements Ltd",
    shortName: "Sahyadri",
    initials: "SC",
    industry: "Cement",
    country: "India",
    fiscalYearStart: "April",
    reportingStandard: "BRSR",
    status: "Active",
    reportingStatus: "Behind Schedule",
    primaryContact: { name: "Rohan Deshpande", role: "ESG Director", email: "rohan.d@sahyadricem.in" },
    leadConsultant: "Rahul Verma",
    totalEmissionsYTD: 482914.8,
    yoyDeltaPct: 4.2,
    employees: 4200,
    facilitiesCount: 7,
    dataSourcesActive: 12,
    pendingItems: 38,
    lastActivity: "Yesterday",
    engagementSince: "Jan 2022",
  },
  {
    id: "cl_3",
    name: "Mahalaxmi Textiles",
    shortName: "Mahalaxmi",
    initials: "MT",
    industry: "Textiles",
    country: "India",
    fiscalYearStart: "April",
    reportingStandard: "GRI",
    status: "Active",
    reportingStatus: "Submitted",
    primaryContact: { name: "Sneha Patel", role: "Sustainability Lead", email: "sneha.p@mahalaxmi.in" },
    leadConsultant: "Priya Nair",
    totalEmissionsYTD: 18420.6,
    yoyDeltaPct: -12.1,
    employees: 2100,
    facilitiesCount: 4,
    dataSourcesActive: 6,
    pendingItems: 0,
    lastActivity: "3 days ago",
    engagementSince: "Sep 2022",
  },
  {
    id: "cl_4",
    name: "BlueOcean Logistics",
    shortName: "BlueOcean",
    initials: "BO",
    industry: "Logistics & Transport",
    country: "India",
    fiscalYearStart: "April",
    reportingStandard: "BRSR",
    status: "Onboarding",
    reportingStatus: "Setup",
    primaryContact: { name: "Karan Malhotra", role: "Chief Financial Officer", email: "karan@blueocean.co.in" },
    leadConsultant: "Vikram Singh",
    totalEmissionsYTD: 0,
    yoyDeltaPct: 0,
    employees: 850,
    facilitiesCount: 3,
    dataSourcesActive: 1,
    pendingItems: 0,
    lastActivity: "5 days ago",
    engagementSince: "Mar 2026",
  },
  {
    id: "cl_5",
    name: "Vridhi Pharmaceuticals",
    shortName: "Vridhi",
    initials: "VP",
    industry: "Pharmaceuticals",
    country: "India",
    fiscalYearStart: "April",
    reportingStandard: "BOTH",
    status: "Active",
    reportingStatus: "Final Review",
    primaryContact: { name: "Dr. Anika Krishnan", role: "Chief Sustainability Officer", email: "anika@vridhipharma.com" },
    leadConsultant: "Aisha Sharma",
    totalEmissionsYTD: 9214.3,
    yoyDeltaPct: -3.7,
    employees: 1450,
    facilitiesCount: 3,
    dataSourcesActive: 7,
    pendingItems: 4,
    lastActivity: "Today",
    engagementSince: "Nov 2023",
  },
  {
    id: "cl_6",
    name: "Annapurna Foods Ltd",
    shortName: "Annapurna",
    initials: "AF",
    industry: "FMCG",
    country: "India",
    fiscalYearStart: "April",
    reportingStandard: "BRSR",
    status: "Paused",
    reportingStatus: "Draft",
    primaryContact: { name: "Ramesh Iyer", role: "Director — Operations", email: "ramesh.i@annapurnafoods.in" },
    leadConsultant: "Rahul Verma",
    totalEmissionsYTD: 4218.9,
    yoyDeltaPct: 1.4,
    employees: 980,
    facilitiesCount: 2,
    dataSourcesActive: 4,
    pendingItems: 2,
    lastActivity: "2 weeks ago",
    engagementSince: "Apr 2024",
  },
];

export interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  country: string;
  employees: number;
}

export const MOCK_FACILITIES: Facility[] = [
  { id: "f_1", name: "Bengaluru HQ", type: "Office", address: "Embassy Tech Square, Outer Ring Rd", country: "India", employees: 450 },
  { id: "f_2", name: "Pune Data Center", type: "Data Center", address: "Hinjawadi Phase II, Pune", country: "India", employees: 120 },
  { id: "f_3", name: "Ahmedabad Plant", type: "Manufacturing", address: "GIDC Sanand II Industrial Estate", country: "India", employees: 850 },
  { id: "f_4", name: "Mumbai HQ", type: "Office", address: "Bandra Kurla Complex, Mumbai", country: "India", employees: 220 },
  { id: "f_5", name: "Pune Warehouse", type: "Warehouse", address: "Chakan MIDC, Pune", country: "India", employees: 65 },
];

export interface EmissionFactor {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  source: string;
  lastUpdated: string;
  scope: Scope;
  versions?: { version: string; value: number; updated: string; note: string }[];
}

export const MOCK_FACTORS: EmissionFactor[] = [
  { id: "ef_1", name: "Grid Electricity (India)", category: "Electricity", value: 0.82, unit: "kgCO2e/kWh", source: "CEA India", lastUpdated: "2024-12-01", scope: "Scope 2",
    versions: [{ version: "v3", value: 0.82, updated: "2024-12-01", note: "CEA Baseline Database v19" }, { version: "v2", value: 0.79, updated: "2023-12-01", note: "CEA Baseline Database v18" }] },
  { id: "ef_2", name: "Diesel (Stationary Combustion)", category: "Fuel", value: 2.68, unit: "kgCO2e/L", source: "IPCC 2006", lastUpdated: "2024-01-15", scope: "Scope 1" },
  { id: "ef_3", name: "Petrol (Mobile Combustion)", category: "Fuel", value: 2.31, unit: "kgCO2e/L", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 1" },
  { id: "ef_4", name: "Natural Gas", category: "Fuel", value: 2.02, unit: "kgCO2e/m3", source: "IPCC 2006", lastUpdated: "2024-01-15", scope: "Scope 1" },
  { id: "ef_5", name: "LPG", category: "Fuel", value: 2.98, unit: "kgCO2e/kg", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 1" },
  { id: "ef_6", name: "Coal (Bituminous)", category: "Fuel", value: 2.42, unit: "kgCO2e/kg", source: "IPCC 2006", lastUpdated: "2024-01-15", scope: "Scope 1" },
  { id: "ef_7", name: "Refrigerant R-134a", category: "Refrigerants", value: 1430, unit: "kgCO2e/kg", source: "IPCC AR5", lastUpdated: "2024-03-10", scope: "Scope 1" },
  { id: "ef_8", name: "Refrigerant R-410a", category: "Refrigerants", value: 2088, unit: "kgCO2e/kg", source: "IPCC AR5", lastUpdated: "2024-03-10", scope: "Scope 1" },
  { id: "ef_9", name: "Refrigerant R-32", category: "Refrigerants", value: 675, unit: "kgCO2e/kg", source: "IPCC AR5", lastUpdated: "2024-03-10", scope: "Scope 1" },
  { id: "ef_10", name: "Business Travel - Domestic Air (Short Haul)", category: "Business Travel", value: 0.246, unit: "kgCO2e/km", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_11", name: "Business Travel - International Air (Long Haul)", category: "Business Travel", value: 0.148, unit: "kgCO2e/km", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_12", name: "Business Travel - Rail (India)", category: "Business Travel", value: 0.041, unit: "kgCO2e/km", source: "Indian Railways EFR", lastUpdated: "2024-04-01", scope: "Scope 3" },
  { id: "ef_13", name: "Business Travel - Taxi (Petrol)", category: "Business Travel", value: 0.198, unit: "kgCO2e/km", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_14", name: "Employee Commute - Bus", category: "Employee Commute", value: 0.103, unit: "kgCO2e/km", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_15", name: "Employee Commute - Two Wheeler", category: "Employee Commute", value: 0.085, unit: "kgCO2e/km", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_16", name: "Water - Supply", category: "Water", value: 0.344, unit: "kgCO2e/m3", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_17", name: "Water - Treatment", category: "Water", value: 0.708, unit: "kgCO2e/m3", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_18", name: "Waste - Landfill (Mixed)", category: "Waste", value: 458, unit: "kgCO2e/tonne", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_19", name: "Waste - Recycled (Mixed)", category: "Waste", value: 21.4, unit: "kgCO2e/tonne", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_20", name: "Paper - Office Use", category: "Materials", value: 919, unit: "kgCO2e/tonne", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_21", name: "Steel - Virgin", category: "Materials", value: 2890, unit: "kgCO2e/tonne", source: "ICE Database", lastUpdated: "2024-02-12", scope: "Scope 3" },
  { id: "ef_22", name: "Cement - Portland", category: "Materials", value: 902, unit: "kgCO2e/tonne", source: "ICE Database", lastUpdated: "2024-02-12", scope: "Scope 3" },
  { id: "ef_23", name: "Aluminum - Virgin", category: "Materials", value: 11500, unit: "kgCO2e/tonne", source: "ICE Database", lastUpdated: "2024-02-12", scope: "Scope 3" },
  { id: "ef_24", name: "Diesel Generator", category: "Stationary Combustion", value: 2.68, unit: "kgCO2e/L", source: "IPCC 2006", lastUpdated: "2024-01-15", scope: "Scope 1" },
  { id: "ef_25", name: "Solar PV (Onsite)", category: "Renewable Energy", value: 0, unit: "kgCO2e/kWh", source: "Internal", lastUpdated: "2024-04-01", scope: "Scope 2" },
  { id: "ef_26", name: "Hotel Stay (India)", category: "Business Travel", value: 24.3, unit: "kgCO2e/night", source: "Cornell HCMI", lastUpdated: "2024-05-15", scope: "Scope 3" },
  { id: "ef_27", name: "Goods Transport - Truck (Diesel)", category: "Transportation", value: 0.211, unit: "kgCO2e/tonne-km", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_28", name: "Goods Transport - Rail Freight", category: "Transportation", value: 0.027, unit: "kgCO2e/tonne-km", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 3" },
  { id: "ef_29", name: "Purchased Steam", category: "Steam", value: 0.187, unit: "kgCO2e/MJ", source: "DEFRA", lastUpdated: "2024-06-20", scope: "Scope 2" },
  { id: "ef_30", name: "Wastewater Treatment", category: "Waste", value: 0.708, unit: "kgCO2e/m3", source: "IPCC 2006", lastUpdated: "2024-01-15", scope: "Scope 3" },
];

export interface UploadDoc {
  id: string;
  filename: string;
  type: "PDF" | "Excel" | "CSV";
  uploadedBy: string;
  size: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  status: UploadStatus;
  facility: string;
  category: string;
  lineItemCount: number;
}

const UPLOAD_PEOPLE = ["Aisha Sharma", "Rahul Verma", "Priya Nair", "Vikram Singh", "Neha Iyer"];
const UPLOAD_CATEGORIES = ["Electricity Bills", "Fuel Invoices", "Travel Receipts", "Refrigerant Logs", "Waste Manifests", "Procurement"];
const UPLOAD_VENDORS = ["Tata Power", "BESCOM", "MSEB", "Indian Oil", "BPCL", "HPCL", "MakeMyTrip", "ClearTrip", "Voltas", "Daikin", "Antony Waste"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seededRandom(42);

export const MOCK_UPLOADS: UploadDoc[] = (() => {
  const out: UploadDoc[] = [];
  const statuses: UploadStatus[] = ["Processing", "Needs Review", "Completed", "Completed", "Completed", "Failed"];
  const types: ("PDF" | "Excel" | "CSV")[] = ["PDF", "PDF", "Excel", "CSV"];
  for (let i = 1; i <= 56; i++) {
    const status = statuses[Math.floor(rand() * statuses.length)];
    const type = types[Math.floor(rand() * types.length)];
    const vendor = UPLOAD_VENDORS[Math.floor(rand() * UPLOAD_VENDORS.length)];
    const category = UPLOAD_CATEGORIES[Math.floor(rand() * UPLOAD_CATEGORIES.length)];
    const facility = MOCK_FACILITIES[Math.floor(rand() * MOCK_FACILITIES.length)];
    const date = new Date(Date.now() - Math.floor(rand() * 120) * 24 * 60 * 60 * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const periodEnd = new Date(date.getFullYear(), date.getMonth(), 0);
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    out.push({
      id: `up_${i}`,
      filename: `${vendor.replace(/\s+/g, "")}-${yyyy}${mm}-${1000 + i}.${type.toLowerCase()}`,
      type,
      uploadedBy: UPLOAD_PEOPLE[Math.floor(rand() * UPLOAD_PEOPLE.length)],
      size: `${(rand() * 4.8 + 0.2).toFixed(1)} MB`,
      date: date.toISOString(),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      status,
      facility: facility.name,
      category,
      lineItemCount: Math.floor(rand() * 28) + 4,
    });
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
})();

export interface ExtractedLineItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  vendor: string;
  date: string;
  confidence: ConfidenceLevel;
  factorId: string;
  notes?: string;
}

export const generateExtractedItems = (uploadId: string): ExtractedLineItem[] => {
  const r = seededRandom(uploadId.split("_")[1] ? parseInt(uploadId.split("_")[1]) * 31 : 7);
  const upload = MOCK_UPLOADS.find((u) => u.id === uploadId);
  const count = upload?.lineItemCount ?? 8;
  const items: ExtractedLineItem[] = [];
  for (let i = 0; i < count; i++) {
    const factor = MOCK_FACTORS[Math.floor(r() * MOCK_FACTORS.length)];
    const conf: ConfidenceLevel = r() > 0.75 ? "low" : r() > 0.4 ? "medium" : "high";
    const qty = Math.round((r() * 8000 + 50) * 10) / 10;
    const date = new Date(Date.now() - Math.floor(r() * 90) * 24 * 60 * 60 * 1000);
    items.push({
      id: `${uploadId}_li_${i + 1}`,
      description: `${factor.category} — Line ${i + 1}`,
      category: factor.category,
      quantity: qty,
      unit: factor.unit.split("/")[1] ?? "unit",
      vendor: UPLOAD_VENDORS[Math.floor(r() * UPLOAD_VENDORS.length)],
      date: date.toISOString().split("T")[0],
      confidence: conf,
      factorId: factor.id,
    });
  }
  return items;
};

export interface EmissionRecord {
  id: string;
  date: string;
  facility: string;
  scope: Scope;
  category: string;
  activity: string;
  quantity: number;
  unit: string;
  emissionFactor: number;
  factorName: string;
  kgCO2e: number;
  sourceDoc: string;
  status: "Approved" | "Ready for Approval" | "Needs Review";
  approvedBy?: string;
  approvedAt?: string;
}

export const MOCK_EMISSIONS: EmissionRecord[] = (() => {
  const r = seededRandom(99);
  const out: EmissionRecord[] = [];
  for (let i = 1; i <= 240; i++) {
    const factor = MOCK_FACTORS[Math.floor(r() * MOCK_FACTORS.length)];
    const facility = MOCK_FACILITIES[Math.floor(r() * MOCK_FACILITIES.length)];
    const quantity = Math.round((r() * 5000 + 100) * 10) / 10;
    const kgCO2e = Math.round(quantity * factor.value * 100) / 100;
    const date = new Date(Date.now() - Math.floor(r() * 180) * 24 * 60 * 60 * 1000);
    const status: EmissionRecord["status"] = r() > 0.85 ? "Needs Review" : r() > 0.1 ? "Approved" : "Ready for Approval";
    out.push({
      id: `em_${i}`,
      date: date.toISOString().split("T")[0],
      facility: facility.name,
      scope: factor.scope,
      category: factor.category,
      activity: `${factor.category} consumption — ${facility.name}`,
      quantity,
      unit: factor.unit.split("/")[1] ?? "unit",
      emissionFactor: factor.value,
      factorName: factor.name,
      kgCO2e,
      sourceDoc: `up_${Math.floor(r() * 56) + 1}`,
      status,
      approvedBy: status === "Approved" ? UPLOAD_PEOPLE[Math.floor(r() * UPLOAD_PEOPLE.length)] : undefined,
      approvedAt: status === "Approved" ? date.toISOString() : undefined,
    });
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
})();

export interface ReportItem {
  id: string;
  name: string;
  standard: "BRSR" | "GRI";
  period: string;
  status: "Draft" | "Final" | "Submitted";
  generatedBy: string;
  generatedOn: string;
  totalEmissions: number;
  client: string;
}

export const MOCK_REPORTS: ReportItem[] = [
  { id: "r_1", name: "BRSR FY24-25 Q3 Draft", standard: "BRSR", period: "Oct 2024 — Dec 2024", status: "Draft", generatedBy: "Aisha Sharma", generatedOn: "2025-01-08", totalEmissions: 1284.5, client: "TechCorp India" },
  { id: "r_2", name: "GRI 2024 Annual", standard: "GRI", period: "Jan 2024 — Dec 2024", status: "Final", generatedBy: "Rahul Verma", generatedOn: "2025-02-14", totalEmissions: 5412.8, client: "TechCorp India" },
  { id: "r_3", name: "BRSR FY23-24 Final", standard: "BRSR", period: "Apr 2023 — Mar 2024", status: "Submitted", generatedBy: "Aisha Sharma", generatedOn: "2024-05-30", totalEmissions: 4892.1, client: "TechCorp India" },
  { id: "r_4", name: "GRI 2023 Annual", standard: "GRI", period: "Jan 2023 — Dec 2023", status: "Submitted", generatedBy: "Priya Nair", generatedOn: "2024-03-21", totalEmissions: 4651.3, client: "TechCorp India" },
  { id: "r_5", name: "BRSR FY24-25 H1", standard: "BRSR", period: "Apr 2024 — Sep 2024", status: "Final", generatedBy: "Aisha Sharma", generatedOn: "2024-10-15", totalEmissions: 2731.4, client: "TechCorp India" },
];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: ConsultantRole;
  clientsAssigned: number;
  lastActive: string;
  status: "Active" | "Invited" | "Inactive";
  avatar: string;
}

export const MOCK_USERS: TeamMember[] = [
  { id: "tu_1", name: "Aisha Sharma", email: "aisha.s@greenedge.in", role: "Manager", clientsAssigned: 4, lastActive: "2 minutes ago", status: "Active", avatar: "AS" },
  { id: "tu_2", name: "Rahul Verma", email: "rahul.v@greenedge.in", role: "Manager", clientsAssigned: 3, lastActive: "12 hours ago", status: "Active", avatar: "RV" },
  { id: "tu_3", name: "Priya Nair", email: "priya.n@greenedge.in", role: "Partner", clientsAssigned: 6, lastActive: "1 day ago", status: "Active", avatar: "PN" },
  { id: "tu_4", name: "Vikram Singh", email: "vikram.s@greenedge.in", role: "Consultant", clientsAssigned: 2, lastActive: "3 days ago", status: "Active", avatar: "VS" },
  { id: "tu_5", name: "Neha Iyer", email: "neha.i@greenedge.in", role: "Analyst", clientsAssigned: 1, lastActive: "5 days ago", status: "Active", avatar: "NI" },
  { id: "tu_6", name: "Arjun Mehta", email: "arjun.m@greenedge.in", role: "Consultant", clientsAssigned: 0, lastActive: "Never", status: "Invited", avatar: "AM" },
  { id: "tu_7", name: "Kavita Rao", email: "kavita.r@greenedge.in", role: "Analyst", clientsAssigned: 0, lastActive: "32 days ago", status: "Inactive", avatar: "KR" },
];

export interface SmeTeamMember {
  id: string;
  name: string;
  email: string;
  role: SmeRole;
  function: string;
  lastActive: string;
  status: "Active" | "Invited" | "Inactive";
  avatar: string;
}

export const MOCK_SME_USERS: SmeTeamMember[] = [
  { id: "su_1", name: "Vivek Bhatia", email: "vivek.b@techcorp.in", role: "Owner", function: "Sustainability", lastActive: "5 minutes ago", status: "Active", avatar: "VB" },
  { id: "su_2", name: "Ananya Rao", email: "ananya.r@techcorp.in", role: "Approver", function: "Finance", lastActive: "3 hours ago", status: "Active", avatar: "AR" },
  { id: "su_3", name: "Kunal Mehta", email: "kunal.m@techcorp.in", role: "Contributor", function: "Facilities", lastActive: "Yesterday", status: "Active", avatar: "KM" },
  { id: "su_4", name: "Meera Singh", email: "meera.s@techcorp.in", role: "Contributor", function: "Procurement", lastActive: "4 days ago", status: "Active", avatar: "MS" },
  { id: "su_5", name: "Ritika Shah", email: "ritika.s@techcorp.in", role: "Viewer", function: "Leadership", lastActive: "Never", status: "Invited", avatar: "RS" },
];

export const MOCK_ROLE_PERMISSIONS = [
  { permission: "View client portfolio & dashboards", Partner: true, Manager: true, Consultant: true, Analyst: true },
  { permission: "Add and remove clients", Partner: true, Manager: true, Consultant: false, Analyst: false },
  { permission: "Upload data on a client's behalf", Partner: true, Manager: true, Consultant: true, Analyst: true },
  { permission: "Edit extracted line items", Partner: true, Manager: true, Consultant: true, Analyst: true },
  { permission: "Approve emissions records", Partner: true, Manager: true, Consultant: true, Analyst: false },
  { permission: "Generate reports", Partner: true, Manager: true, Consultant: true, Analyst: true },
  { permission: "Submit reports to regulators", Partner: true, Manager: true, Consultant: false, Analyst: false },
  { permission: "Manage shared factor library", Partner: true, Manager: true, Consultant: false, Analyst: false },
  { permission: "Invite firm team members", Partner: true, Manager: true, Consultant: false, Analyst: false },
  { permission: "Manage firm billing & subscription", Partner: true, Manager: false, Consultant: false, Analyst: false },
];

export const MOCK_SME_ROLE_PERMISSIONS = [
  { permission: "View dashboards and emissions ledger", Owner: true, Approver: true, Contributor: true, Viewer: true },
  { permission: "Upload activity data and evidence", Owner: true, Approver: true, Contributor: true, Viewer: false },
  { permission: "Edit extracted line items", Owner: true, Approver: true, Contributor: true, Viewer: false },
  { permission: "Approve emissions records", Owner: true, Approver: true, Contributor: false, Viewer: false },
  { permission: "Generate reports", Owner: true, Approver: true, Contributor: false, Viewer: false },
  { permission: "Mark reports as submitted", Owner: true, Approver: false, Contributor: false, Viewer: false },
  { permission: "Manage facilities and reporting boundary", Owner: true, Approver: true, Contributor: false, Viewer: false },
  { permission: "Invite organization users", Owner: true, Approver: false, Contributor: false, Viewer: false },
];

const MONTHS_12 = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export interface DashboardStats {
  totalEmissions: number;
  totalEmissionsLastYear: number;
  yoyDeltaPct: number;
  activeSources: number;
  pendingReviews: number;
  reportsGenerated: number;
  scopeBreakdown: { name: string; value: number }[];
  monthlyTrend: { month: string; current: number; previous: number }[];
  topSources: { name: string; value: number }[];
  insights: { id: string; severity: "warning" | "info" | "success"; title: string; detail: string; timeAgo: string }[];
  activity: { id: string; actor: string; action: string; target: string; timeAgo: string }[];
}

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalEmissions: 2731.4,
  totalEmissionsLastYear: 3018.2,
  yoyDeltaPct: -9.5,
  activeSources: 8,
  pendingReviews: 12,
  reportsGenerated: 5,
  scopeBreakdown: [
    { name: "Scope 1", value: 612.4 },
    { name: "Scope 2", value: 1486.7 },
    { name: "Scope 3", value: 632.3 },
  ],
  monthlyTrend: MONTHS_12.map((m, i) => ({
    month: m,
    current: Math.round((180 + Math.sin(i / 2) * 60 + (rand() * 40 - 20)) * 10) / 10,
    previous: Math.round((220 + Math.sin(i / 2 + 1) * 50 + (rand() * 40 - 20)) * 10) / 10,
  })),
  topSources: [
    { name: "Grid Electricity — Ahmedabad Plant", value: 982.4 },
    { name: "Grid Electricity — Pune Data Center", value: 504.3 },
    { name: "Diesel Generator — Ahmedabad Plant", value: 318.7 },
    { name: "Business Travel — Domestic Air", value: 241.2 },
    { name: "Refrigerant R-410a — Bengaluru HQ", value: 187.5 },
  ],
  insights: [
    { id: "i_1", severity: "warning", title: "Diesel consumption up 23% in Q2", detail: "Ahmedabad Plant generator runtime increased significantly compared to Q1. Check fuel reconciliation with the client.", timeAgo: "2 hours ago" },
    { id: "i_2", severity: "warning", title: "12 invoices need manual review", detail: "Low-confidence extraction across recent uploads. Most are scanned electricity bills from BESCOM.", timeAgo: "5 hours ago" },
    { id: "i_3", severity: "warning", title: "Ahmedabad facility missing September data", detail: "No electricity bill ingested for the period 01–30 Sep 2024. BRSR Q3 report blocked. Follow up with Vivek Bhatia.", timeAgo: "1 day ago" },
    { id: "i_4", severity: "success", title: "Solar PV offset 184 tCO2e this quarter", detail: "Onsite solar generation at Bengaluru HQ exceeded forecast by 11%.", timeAgo: "2 days ago" },
    { id: "i_5", severity: "info", title: "CEA grid factor updated", detail: "India grid emission factor revised from 0.79 to 0.82 kgCO2e/kWh. 38 records recalculated across all clients.", timeAgo: "3 days ago" },
  ],
  activity: [
    { id: "a_1", actor: "Aisha Sharma", action: "uploaded for TechCorp India:", target: "TataPower-202412-1056.pdf", timeAgo: "2 hours ago" },
    { id: "a_2", actor: "Rahul Verma", action: "approved 14 line items in", target: "BESCOM-202411-1042.pdf", timeAgo: "4 hours ago" },
    { id: "a_3", actor: "Priya Nair", action: "generated", target: "BRSR FY24-25 Q3 Draft", timeAgo: "1 day ago" },
    { id: "a_4", actor: "System", action: "auto-categorized", target: "23 line items as Scope 2", timeAgo: "1 day ago" },
    { id: "a_5", actor: "Vikram Singh", action: "edited factor", target: "Grid Electricity (India)", timeAgo: "3 days ago" },
    { id: "a_6", actor: "Aisha Sharma", action: "invited", target: "arjun.m@greenedge.in as Consultant", timeAgo: "4 days ago" },
  ],
};

export interface PortfolioStats {
  totalClients: number;
  activeEngagements: number;
  totalEmissions: number;
  reportsInProgress: number;
  pendingReviews: number;
  industriesCovered: number;
}

export const MOCK_PORTFOLIO_STATS: PortfolioStats = {
  totalClients: MOCK_CLIENTS.length,
  activeEngagements: MOCK_CLIENTS.filter((c) => c.status === "Active").length,
  totalEmissions: MOCK_CLIENTS.reduce((acc, c) => acc + c.totalEmissionsYTD, 0),
  reportsInProgress: 4,
  pendingReviews: MOCK_CLIENTS.reduce((acc, c) => acc + c.pendingItems, 0),
  industriesCovered: new Set(MOCK_CLIENTS.map((c) => c.industry)).size,
};

export const INDUSTRIES = [
  { id: "manufacturing", name: "Manufacturing", desc: "Heavy emissions from process heat, equipment, and on-site fuel." },
  { id: "it-ites", name: "IT / ITES", desc: "Electricity-dominated profile from data centers and office spaces." },
  { id: "pharma", name: "Pharmaceuticals", desc: "Process emissions, refrigerants, and high-purity utilities." },
  { id: "cement", name: "Cement", desc: "Process CO2 from clinker plus fuel combustion in kilns." },
  { id: "steel", name: "Steel", desc: "Coal, coke, and electricity-intensive primary production." },
  { id: "textiles", name: "Textiles", desc: "Steam, dyeing, and supply-chain water footprint." },
  { id: "fmcg", name: "FMCG", desc: "Packaging, logistics, and refrigeration across distribution." },
  { id: "power", name: "Power Generation", desc: "Direct combustion emissions and grid losses." },
  { id: "logistics", name: "Logistics & Transport", desc: "Owned fleet, third-party transport, and warehousing." },
  { id: "other", name: "Other", desc: "We will tailor the factor library to your activity profile." },
];

export const DATA_SOURCES = [
  { id: "electricity", name: "Electricity Bills", desc: "Monthly utility invoices from your DISCOM." },
  { id: "fuel", name: "Fuel Invoices", desc: "Diesel, petrol, LPG, and natural gas receipts." },
  { id: "travel", name: "Travel Receipts", desc: "Air, rail, taxi, and hotel itineraries." },
  { id: "excel", name: "Excel / CSV Upload", desc: "Bring your own structured spreadsheets." },
  { id: "sap", name: "SAP Export", desc: "Procurement and finance modules from SAP ECC/S4." },
  { id: "tally", name: "Tally Export", desc: "Vouchers, ledgers, and stock from Tally Prime." },
  { id: "oracle", name: "Oracle ERP", desc: "GL, AP, and inventory from Oracle Fusion." },
  { id: "api", name: "Custom API", desc: "Stream live data from your internal systems." },
];
