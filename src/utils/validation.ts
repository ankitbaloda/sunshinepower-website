export const validatePhone = (phone: string): boolean => {
  const indianPhoneRegex = /^[6-9]\d{9}$/;
  return indianPhoneRegex.test(phone.replace(/\D/g, ''));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
};

export const calculateROI = (monthlyBill: number) => {
  // Approximate calculations for Rajasthan solar conditions
  const avgUnitsPerMonth = monthlyBill / 6; // Assuming ₹6 per unit
  const systemSizeKW = Math.ceil(avgUnitsPerMonth / 120); // 120 units per kW per month
  const systemCost = systemSizeKW * 65000; // ₹65,000 per kW including installation
  const monthlyGeneration = systemSizeKW * 120;
  const monthlySavings = monthlyGeneration * 6;
  const annualSavings = monthlySavings * 12;
  const paybackPeriod = systemCost / annualSavings;
  const co2Reduction = systemSizeKW * 1.2; // Tons per year

  return {
    systemSize: systemSizeKW,
    monthlyGeneration,
    monthlySavings,
    annualSavings,
    systemCost,
    paybackPeriod,
    co2Reduction
  };
};