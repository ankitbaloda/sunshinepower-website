import React, { useState } from 'react';
import { Calculator, IndianRupee, Zap, Leaf } from 'lucide-react';
import { calculateROI } from '../utils/validation';

const ROICalculator: React.FC = () => {
  const [monthlyBill, setMonthlyBill] = useState<string>('');
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const bill = parseFloat(monthlyBill);
    if (bill > 0) {
      const roiData = calculateROI(bill);
      setResults(roiData);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#173B63] mb-6">
              Solar Savings Calculator
            </h2>
            <p className="text-xl text-gray-600">
              Discover how much you can save with solar power. Enter your monthly electricity bill to get started.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#E6F2FF] to-blue-50 rounded-3xl p-8 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calculator Input */}
              <div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center mb-6">
                    <div className="bg-[#F7C948] w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                      <Calculator className="text-[#173B63]" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-[#173B63]">Calculate Your Savings</h3>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="monthlyBill" className="block text-sm font-semibold text-gray-700 mb-2">
                      Monthly Electricity Bill (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        id="monthlyBill"
                        value={monthlyBill}
                        onChange={(e) => setMonthlyBill(e.target.value)}
                        placeholder="Enter your monthly bill"
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F7C948] focus:border-transparent text-lg"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCalculate}
                    disabled={!monthlyBill || parseFloat(monthlyBill) <= 0}
                    className="w-full bg-[#173B63] hover:bg-[#173B63]/90 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-lg transition-colors duration-200"
                  >
                    Calculate Savings
                  </button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    * Results are approximate estimates based on average solar conditions in Jaipur
                  </p>
                </div>
              </div>

              {/* Results */}
              <div>
                {results ? (
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-2xl font-bold text-[#173B63] mb-6">Your Solar Benefits</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                        <div className="flex items-center">
                          <Zap className="text-green-600 mr-3" size={20} />
                          <span className="font-semibold text-gray-700">Recommended System Size</span>
                        </div>
                        <span className="text-xl font-bold text-green-600">{results.systemSize} kW</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center">
                          <IndianRupee className="text-blue-600 mr-3" size={20} />
                          <span className="font-semibold text-gray-700">Monthly Savings</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">{formatCurrency(results.monthlySavings)}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center">
                          <IndianRupee className="text-purple-600 mr-3" size={20} />
                          <span className="font-semibold text-gray-700">Annual Savings</span>
                        </div>
                        <span className="text-xl font-bold text-purple-600">{formatCurrency(results.annualSavings)}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                        <div className="flex items-center">
                          <IndianRupee className="text-orange-600 mr-3" size={20} />
                          <span className="font-semibold text-gray-700">Investment Recovery</span>
                        </div>
                        <span className="text-xl font-bold text-orange-600">{results.paybackPeriod.toFixed(1)} years</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                        <div className="flex items-center">
                          <Leaf className="text-green-600 mr-3" size={20} />
                          <span className="font-semibold text-gray-700">CO₂ Saved Annually</span>
                        </div>
                        <span className="text-xl font-bold text-green-600">{results.co2Reduction.toFixed(1)} tons</span>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-[#E6F2FF] rounded-xl border-l-4 border-[#F7C948]">
                      <p className="text-sm text-[#173B63] font-semibold">
                        💡 With government subsidies, your actual investment could be {formatCurrency(results.systemCost * 0.6)} or less!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 shadow-lg h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Calculator size={48} className="mx-auto mb-4" />
                      <p className="text-lg">Enter your monthly bill to see potential savings</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;