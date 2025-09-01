export interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  city: string;
  rooftopType: string;
  monthlyBill: string;
  message: string;
}

export interface ROICalculation {
  systemSize: number;
  monthlyGeneration: number;
  monthlySavings: number;
  annualSavings: number;
  systemCost: number;
  paybackPeriod: number;
  co2Reduction: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}