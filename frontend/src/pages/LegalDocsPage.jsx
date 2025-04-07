import { useState } from 'react';
import LegalDocRecommendations from '../components/LegalDocRecommendations';

const LegalDocsPage = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Common countries for quick selection
  const popularCountries = [
    'United States', 'Canada', 'United Kingdom', 'France', 'Germany', 
    'Japan', 'Australia', 'India', 'Brazil', 'Mexico', 'China'
  ];
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (source && destination) {
      setSubmitted(true);
    }
  };
  
  // Quick select buttons for common destinations
  const QuickSelectButton = ({ country, setter, currentValue }) => (
    <button
      type="button"
      onClick={() => setter(country)}
      className={`px-3 py-1 text-xs rounded-full mr-2 mb-2 ${
        currentValue === country 
          ? 'bg-[#56288A] text-white' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
      }`}
    >
      {country}
    </button>
  );
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Travel Document Advisor</h1>
          
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Country (Source)
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-transparent"
                  placeholder="e.g., United States"
                  required
                />
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Popular countries:</p>
                  <div className="flex flex-wrap">
                    {popularCountries.slice(0, 6).map(country => (
                      <QuickSelectButton 
                        key={country} 
                        country={country} 
                        setter={setSource}
                        currentValue={source}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Country
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-transparent"
                  placeholder="e.g., Japan"
                  required
                />
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Popular destinations:</p>
                  <div className="flex flex-wrap">
                    {popularCountries.slice(6).map(country => (
                      <QuickSelectButton 
                        key={country} 
                        country={country} 
                        setter={setDestination}
                        currentValue={destination}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="mt-6 bg-[#56288A] text-white px-6 py-2 rounded-md hover:bg-[#4a2178] focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:ring-offset-2"
            >
              Get Required Documents
            </button>
          </form>
        </div>
      </div>
      
      {submitted && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <LegalDocRecommendations source={source} destination={destination} />
          </div>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Note: This tool provides general guidance only. Always check with official government sources and embassies for the most up-to-date requirements before traveling.</p>
      </div>
    </div>
  );
};

export default LegalDocsPage; 