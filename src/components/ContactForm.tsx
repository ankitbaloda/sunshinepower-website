import React, { useState } from 'react';
import { Send, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { validatePhone, validateEmail, formatPhone } from '../utils/validation';
import { COMPANY_INFO, ROOFTOP_TYPES, CITIES } from '../utils/constants';
import { ContactFormData } from '../types';

interface ContactFormProps {
  onNavigate: (page: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    city: '',
    rooftopType: '',
    monthlyBill: '',
    message: ''
  });

  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid Indian mobile number';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.rooftopType) newErrors.rooftopType = 'Rooftop type is required';
    if (!formData.monthlyBill.trim()) newErrors.monthlyBill = 'Monthly bill is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate form submission (in real implementation, this would submit to Netlify)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to thank you page
      onNavigate('thank-you');
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#173B63] mb-6">
              Get Your Free Solar Consultation
            </h2>
            <p className="text-xl text-gray-600">
              Ready to start your solar journey? Fill out the form below and our experts will contact you within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="bg-[#173B63] text-white rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-8">Get in Touch</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Phone className="text-[#F7C948] mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Call Us</p>
                      <a href={`tel:+91${COMPANY_INFO.phone}`} className="text-[#F7C948] hover:underline">
                        {formatPhone(COMPANY_INFO.phone)}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Mail className="text-[#F7C948] mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Email Us</p>
                      <a href={`mailto:${COMPANY_INFO.email}`} className="text-[#F7C948] hover:underline">
                        {COMPANY_INFO.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <MapPin className="text-[#F7C948] mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Visit Us</p>
                      <p className="text-gray-300 leading-relaxed">
                        {COMPANY_INFO.address.street}<br />
                        {COMPANY_INFO.address.city}, {COMPANY_INFO.address.state} {COMPANY_INFO.address.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Clock className="text-[#F7C948] mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Business Hours</p>
                      <p className="text-gray-300">
                        Monday - Saturday<br />
                        9:00 AM - 6:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#F7C948] focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#F7C948] focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="10-digit mobile number"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#F7C948] focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#F7C948] focus:border-transparent ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select your city</option>
                      {CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="rooftopType" className="block text-sm font-semibold text-gray-700 mb-2">
                      Rooftop Type *
                    </label>
                    <select
                      id="rooftopType"
                      name="rooftopType"
                      value={formData.rooftopType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#F7C948] focus:border-transparent ${
                        errors.rooftopType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select rooftop type</option>
                      {ROOFTOP_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.rooftopType && <p className="text-red-500 text-sm mt-1">{errors.rooftopType}</p>}
                  </div>

                  <div>
                    <label htmlFor="monthlyBill" className="block text-sm font-semibold text-gray-700 mb-2">
                      Monthly Electricity Bill (₹) *
                    </label>
                    <input
                      type="number"
                      id="monthlyBill"
                      name="monthlyBill"
                      value={formData.monthlyBill}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#F7C948] focus:border-transparent ${
                        errors.monthlyBill ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter monthly bill amount"
                    />
                    {errors.monthlyBill && <p className="text-red-500 text-sm mt-1">{errors.monthlyBill}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F7C948] focus:border-transparent resize-none"
                    placeholder="Tell us about your specific requirements or questions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F7C948] hover:bg-[#F7C948]/90 disabled:bg-gray-400 text-[#173B63] py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 mt-6 transition-all duration-200 hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#173B63]"></div>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Get Free Consultation</span>
                    </>
                  )}
                </button>

                {/* Honeypot field for spam protection */}
                <input
                  type="text"
                  name="bot-field"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;