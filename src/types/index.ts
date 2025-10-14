
// Client type
export interface Client {
  id: string;
  name: string;
  code: string; // This represents the Patente number
  ice?: string; // Optional ICE number
  address?: string; // Optional address
}

// Product type
export interface GasCylinder {
  type: '12KG' | '6KG' | '3KG';
  totalQuantity: number;
  distributedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  taxRate: number;
}

// Invoice type
export interface Invoice {
  id: string;
  number: string;
  date: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  companyName: 'ORANGE ENERGY' | 'TRADIGAZ' | 'ARGANA ENERGY';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface CompanyInfo {
  name: 'ORANGE ENERGY' | 'TRADIGAZ' | 'ARGANA ENERGY';
  address: string;
  rc: string;
  patente: string;
  if?: string;
  cnss: string;
  ice: string;
  logo?: string; // Base64 encoded logo
}

export interface Settings {
  secretCode: string;
  companyName: 'ORANGE ENERGY' | 'TRADIGAZ' | 'ARGANA ENERGY';
  minInvoiceAmount: number;
  maxInvoiceAmount: number;
  companies: {
    [key: string]: CompanyInfo;
  };
}
