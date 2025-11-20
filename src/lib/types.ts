
export type Driver = {
  id: string;
  name: string;
  contact: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  joiningDate: string;
  salary: number;
  status: 'active' | 'inactive';
};

export type Owner = {
  id: string;
  name: string;
  contact: string;
  cnic: string;
  email?: string;
}

export type Chamber = {
  id: string;
  referenceDip: number;
  productDip: number;
}

export type RoutePermit = {
  punjabPermitNo?: string;
  punjabPermitExpiry?: string;
  sindhPermitNo?: string;
  sindhPermitExpiry?: string;
  kpkPermitNo?: string;
  kpkPermitExpiry?: string;
  balochistanPermitNo?: string;
  balochistanPermitExpiry?: string;
  gilgitPermitNo?: string;
  gilgitPermitExpiry?: string;
}

export type Vehicle = {
  id:string;
  ownerId: string;
  registrationNumber: string;
  model: string;
  type: 'Truck' | 'Van' | 'Bus' | 'Car' | 'Oil Tanker' | 'Tank Lorry';
  capacity: string;
  documents: string;
  status: 'active' | 'maintenance' | 'inactive';

  // New detailed fields
  brandName?: string;
  brandStatus?: 'Transfers' | 'Other';
  engineNo?: string;
  engineHp?: number;
  makerName?: string;
  engineCC?: number;
  motorRegAuth?: string;
  chassisNo?: string;
  prevRegMark?: string;
  yearOfManuf?: number;
  ograCompliant?: string;
  calibChartNo?: string;
  calibAuth?: string;
  calibDate?: string;
  calibExpiry?: string;
  tokenExpiry?: string;
  fitnessDate?: string;
  fitnessExpiry?: string;
  explosiveCertNo?: string;
  explosiveApprDate?: string;
  explosiveExpiryDate?: string;
  chkExemptDate?: string;
  tlRemarks?: string;
  
  // Tank Lorry specific fields
  chamberCount?: number;
  totalCapacityLiters?: number;
  chambers?: Chamber[];

  // Route Permits
  routePermits?: RoutePermit;
};

export type Customer = {
  id: string;
  type: 'person' | 'company';
  name: string;
  contact: string;
  address: string;
  email?: string;
  companyName?: string;
  companyRegNo?: string;
  companyOwner?: string;
  memberSince: string;
};

export type City = {
  id:string;
  name: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  cnic: string;
  service: MaterialOrService[];
};

export type TyreDetail = {
  newTyreNo?: string;
  oldTyreNo?: string;
};

export type InstrumentDetail = {
  id: string;
  name: string;
  price: number;
};

export type MaintenanceDetail = {
  type: 'tyre' | 'other';
  tyre?: TyreDetail;
  instruments?: InstrumentDetail[];
  laborCost?: number;
};

export type Expense = {
  id: string;
  tripId: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  supplierId?: string;
  customerId?: string;
  expenseFor?: 'vehicle' | 'driver' | 'customer';
  expenseForId?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdBy: string;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  maintenanceDetail?: MaintenanceDetail;
  challanCityId?: string;
};

export type OilDetail = {
    id: string;
    type: OilType;
    amount: number;
}

export type Shipment = {
    id: string;
    customerId: string;
    fromCityId: string;
    toCityId: string;
    description?: string;
    
    // Fields from invoice
    freightDate?: string;
    loadingDate?: string;
    decantingDate?: string;
    shipmentNo?: string;
    saleOrderNo?: string;
    deliveryNo?: string;
    productName: string;
    quantity: number;
    ratePerUnit: number;
    unit?: ShipmentUnit;
    fare: number; // This is Gross Freight
    rateDiff?: number;
    shortageQty?: number;
    shortageAmount?: number;
    tokenNo?: string;
    advancePenalty?: number;
    penaltyTrackerCharges?: number;
    otherCharges?: number;
    commission?: number;
    wht?: number; // Withholding Tax
    
    oilDetails?: OilDetail[];
}

export type TripPayment = {
    id: string;
    customerId?: string;
    date: string;
    amount: number;
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdBy: string;
}

export type Trip = {
  id: string;
  vehicleId: string;
  driverId: string;
  vehicleReg: string;
  driverName: string;
  routeName: string;
  route: string[];
  customerNames: string[];
  startDate: string;
endDate?: string;
  endCityId?: string;
  status: 'saved' | 'pending' | 'active' | 'completed' | 'cancelled';
  shipments: Shipment[];
  totalRevenue?: number;
  totalExpense?: number;
  netProfit?: number;
  payments?: TripPayment[];
  orderNumber?: string;
  sapNumber?: string;
  tokenNumber?: string;
};

export const expenseCategories = [
  "fuel",
  "maintenance",
  "toll tax",
  "supplier costs",
  "parking rent",
  "food",
  "broker commission",
  "loading/unloading charges",
  "challan",
  "other",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export const materialsAndServices = [
  'petrol',
  'diesel',
  'mobile oil',
  'coal',
  'sand',
  'soil',
  'spare parts',
  'maintenance',
  'tolls',
  'other',
] as const;

export type MaterialOrService = (typeof materialsAndServices)[number];

export const oilTypes = [
    'petrol',
    'diesel',
    'high octane petrol',
    'gas',
    'mobile oil'
] as const;

export type OilType = (typeof oilTypes)[number];

export const shipmentUnits = ['Per Liter', 'Per Ton', 'Fixed'] as const;
export type ShipmentUnit = (typeof shipmentUnits)[number];

export type User = {
  id: string;
  username: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  password?: string;
  permissions?: {
    dashboard?: boolean;
    general?: boolean;
    financials?: boolean;
    approvals?: boolean;
    reports?: boolean;
    billing?: boolean;
    admin?: boolean;
    edit?: boolean; // <-- This line was added
    vehicles?: boolean;
    drivers?: boolean;
    customers?: boolean;
    suppliers?: boolean;
    owners?: boolean;
    trips?: boolean;
    expenses?: boolean;
    accounts?: boolean;
    cities?: boolean;
  }
};

export interface Bill {
    id: string;
    billFor: 'trip' | 'customer' | 'supplier' | 'driver';
    item: any;
    items?: any[];
    fromDate: Date;
    toDate: Date;
    revenue: { description: string; amount: number }[];
    expenses: { description: string; amount: number }[];
    totalAmount: number;
    creditAmount: number;
    debitAmount: number;
    change: number;
    payments: TripPayment[];
    status: 'Paid' | 'Unpaid' | 'Partial';
    generatedBy: string;
    generationDate: Date;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
}
