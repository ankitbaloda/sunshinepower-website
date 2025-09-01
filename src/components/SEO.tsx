import React from 'react';
import { COMPANY_INFO } from '../utils/constants';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  page?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = COMPANY_INFO.description,
  canonical,
  page = 'home'
}) => {
  const fullTitle = title ? `${title} | ${COMPANY_INFO.name}` : `${COMPANY_INFO.name} - ${COMPANY_INFO.tagline}`;
  const currentUrl = canonical || `https://${COMPANY_INFO.domain}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `https://${COMPANY_INFO.domain}/#business`,
        "name": COMPANY_INFO.name,
        "url": `https://${COMPANY_INFO.domain}`,
        "telephone": `+91${COMPANY_INFO.phone}`,
        "email": COMPANY_INFO.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": COMPANY_INFO.address.street,
          "addressLocality": COMPANY_INFO.address.city,
          "addressRegion": COMPANY_INFO.address.state,
          "postalCode": COMPANY_INFO.address.pincode,
          "addressCountry": COMPANY_INFO.address.country
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": COMPANY_INFO.coordinates.lat,
          "longitude": COMPANY_INFO.coordinates.lng
        },
        "sameAs": [
          COMPANY_INFO.whatsapp
        ],
        "openingHours": "Mo-Sa 09:00-18:00",
        "priceRange": "₹₹",
        "description": description,
        "serviceArea": {
          "@type": "City",
          "name": "Jaipur"
        }
      },
      {
        "@type": "FAQPage",
        "@id": `https://${COMPANY_INFO.domain}/#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How much does a rooftop solar system cost in Jaipur?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The cost of a rooftop solar system in Jaipur ranges from ₹50,000 to ₹80,000 per kW, depending on the type and quality of components. Government subsidies can reduce this cost significantly."
            }
          },
          {
            "@type": "Question", 
            "name": "What government subsidies are available for solar in Rajasthan?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Government of India provides a subsidy of ₹14,588 per kW for systems up to 3kW and ₹7,294 per kW for additional capacity up to 10kW. State-specific incentives may also be available."
            }
          },
          {
            "@type": "Question",
            "name": "How long does solar installation take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Typical rooftop solar installation takes 1-3 days depending on system size. The entire process from survey to commissioning usually takes 2-4 weeks including approvals."
            }
          },
          {
            "@type": "Question",
            "name": "What is the payback period for solar in Jaipur?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "With excellent sunlight conditions in Jaipur, solar systems typically pay for themselves in 4-6 years. After that, you enjoy 20+ years of free electricity."
            }
          },
          {
            "@type": "Question",
            "name": "Do you provide maintenance services?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we provide comprehensive maintenance services including cleaning, monitoring, and repairs. We offer AMC packages to ensure optimal performance of your solar system."
            }
          }
        ]
      }
    ]
  };

  React.useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // Add structured data
    let structuredDataScript = document.querySelector('#structured-data');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      structuredDataScript.setAttribute('id', 'structured-data');
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

    // Add Open Graph and Twitter meta tags
    const ogTags = [
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: currentUrl },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: COMPANY_INFO.name },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description }
    ];

    ogTags.forEach(tag => {
      const property = tag.property || tag.name;
      const attr = tag.property ? 'property' : 'name';
      let metaTag = document.querySelector(`meta[${attr}="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attr, property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', tag.content);
    });

  }, [fullTitle, description, currentUrl]);

  return null;
};

export default SEO;