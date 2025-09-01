import React from 'react';
import { Award, Users, Zap, Heart } from 'lucide-react';
import SEO from '../components/SEO';

const About: React.FC = () => {
  const achievements = [
    { icon: Users, label: 'Happy Customers', value: '500+' },
    { icon: Zap, label: 'Solar Capacity Installed', value: '5MW+' },
    { icon: Award, label: 'Years Experience', value: '8+' },
    { icon: Heart, label: 'CO₂ Saved', value: '2000+ tons' }
  ];

  const team = [
    {
      name: 'Rajesh Kumar',
      role: 'Founder & CEO',
      experience: '10+ years in renewable energy',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    },
    {
      name: 'Priya Sharma',
      role: 'Technical Director',
      experience: 'Solar engineering expert',
      image: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    },
    {
      name: 'Amit Singh',
      role: 'Installation Manager',
      experience: 'Certified solar installer',
      image: 'https://images.pexels.com/photos/2102415/pexels-photo-2102415.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    }
  ];

  return (
    <>
      <SEO 
        title="About Us - Solar Energy Experts in Jaipur"
        description="Learn about Sunshine Power's team, mission, and 8+ years of experience in solar energy solutions in Jaipur, Rajasthan."
        canonical="https://sunshinepower.net.in/about"
      />

      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-[#E6F2FF] to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-[#173B63] mb-6">
                About Sunshine Power
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                We're Jaipur's leading solar energy company, committed to bringing clean, affordable electricity to every rooftop in Rajasthan.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#173B63] mb-6">
                    Our Story
                  </h2>
                  <div className="space-y-6 text-gray-600 leading-relaxed">
                    <p>
                      Founded in 2016 in the heart of Jaipur, Sunshine Power began with a simple yet powerful vision: 
                      to make solar energy accessible and affordable for every household in Rajasthan.
                    </p>
                    <p>
                      What started as a small team of passionate engineers has grown into one of Jaipur's most trusted 
                      solar installation companies. We've installed over 5MW of solar capacity, helping families 
                      save crores in electricity bills while contributing to a cleaner environment.
                    </p>
                    <p>
                      Our commitment goes beyond installation. We provide comprehensive support throughout your 
                      solar journey, from initial consultation to decades of maintenance, ensuring you get 
                      maximum value from your investment.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <img 
                    src="https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
                    alt="Solar installation team at work"
                    className="rounded-2xl shadow-2xl"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-[#F7C948] text-[#173B63] p-4 rounded-2xl shadow-lg">
                    <p className="font-bold text-lg">8+ Years</p>
                    <p className="text-sm">of Excellence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="py-20 bg-[#E6F2FF]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#173B63] mb-6">
                Our Achievements
              </h2>
              <p className="text-xl text-gray-600">
                Numbers that reflect our commitment to excellence and customer satisfaction.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <achievement.icon size={32} className="text-[#173B63]" />
                  </div>
                  <div className="text-3xl font-bold text-[#173B63] mb-2">{achievement.value}</div>
                  <div className="text-gray-600 font-medium">{achievement.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#173B63] mb-6">
                Meet Our Team
              </h2>
              <p className="text-xl text-gray-600">
                Experienced professionals dedicated to your solar success.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {team.map((member, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-6">
                    <img 
                      src={member.image}
                      alt={member.name}
                      className="w-48 h-48 rounded-2xl mx-auto object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-[#F7C948] text-[#173B63] px-4 py-2 rounded-lg font-semibold text-sm shadow-lg">
                      {member.role}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#173B63] mb-2">{member.name}</h3>
                  <p className="text-gray-600">{member.experience}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="py-20 bg-gradient-to-br from-[#173B63] to-blue-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12">
                Our Mission & Values
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-[#F7C948] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap size={32} className="text-[#173B63]" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Innovation</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We stay ahead with the latest solar technology and installation techniques.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-[#F7C948] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart size={32} className="text-[#173B63]" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Customer First</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Your satisfaction and long-term success are our top priorities.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-[#F7C948] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award size={32} className="text-[#173B63]" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Quality</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We use only premium components and maintain the highest installation standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;