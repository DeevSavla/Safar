import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from './ui/card';
import Loader from './Loader';

function LegalDocRecommendations({ source, destination }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLegalDocs() {
      if (!source || !destination) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Make API call to the legal documents endpoint
        const response = await axios.post('http://localhost:8000/api/ai/legal-docs', {
          source,
          destination
        });
        
        // Get the response data
        const responseData = response.data;
        
        // Process the response data
        try {
          // If it's already structured properly, use it directly
          if (Array.isArray(responseData)) {
            setRecommendations(responseData);
          } 
          // If it's an object with a documents property that contains documents array
          else if (responseData.documents && responseData.documents.documents && Array.isArray(responseData.documents.documents)) {
            setRecommendations(responseData.documents.documents);
          }
          // If it's an object with a message and documents
          else if (responseData.message && responseData.documents && responseData.documents.documents) {
            setRecommendations(responseData.documents.documents);
          }
          // If it's an object with a documents property, extract it
          else if (responseData.documents && Array.isArray(responseData.documents)) {
            setRecommendations(responseData.documents);
          } 
          // If it's a string (possibly JSON or text with JSON), try to parse it
          else if (typeof responseData === 'string') {
            // Clean the response if it contains markdown code blocks
            let cleanedText = responseData.trim();
            cleanedText = cleanedText.replace(/```json\s*|\s*```/g, '');
            
            // Parse the cleaned text
            const parsedData = JSON.parse(cleanedText);
            
            // Extract documents array based on the specific format
            let documents;
            if (parsedData.documents && parsedData.documents.documents) {
              documents = parsedData.documents.documents;
            } else if (parsedData.documents) {
              documents = parsedData.documents;
            } else {
              documents = parsedData;
            }
            
            if (Array.isArray(documents)) {
              setRecommendations(documents);
            } else {
              throw new Error("Response data is not in the expected format");
            }
          } else {
            throw new Error("Response data is not in the expected format");
          }

          // If there are additional requirements in the response, add them as a document
          if (responseData.documents && responseData.documents.additional_requirements) {
            const additionalReqs = responseData.documents.additional_requirements;
            if (Array.isArray(additionalReqs) && additionalReqs.length > 0) {
              const additionalRequirementsDoc = {
                name: "Additional Requirements",
                requirements: additionalReqs.map(req => req.requirement)
              };
              setRecommendations(prev => [...prev, additionalRequirementsDoc]);
            }
          }
        } catch (parseError) {
          console.error("Error parsing legal documents response:", parseError);
          throw new Error("Failed to parse legal document recommendations");
        }
      } catch (err) {
        console.error("Error fetching legal document recommendations:", err);
        setError("Failed to get legal document recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchLegalDocs();
  }, [source, destination]);
  
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h3 className="text-lg font-medium mb-4 text-[#56288A] flex items-center">
          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Finding essential legal documents for traveling from {source} to {destination}...
        </h3>
        <Loader size="small" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">Error</p>
        </div>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100">
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">No Documents Found</p>
        </div>
        <p>No document recommendations available for this route. Please check another source-destination pair.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.isArray(recommendations) ? recommendations.map((doc, index) => (
          <Card key={index} className="p-4 hover:shadow-lg transition-shadow border-t-4 border-[#56288A]">
            <h4 className="text-lg font-semibold mb-2 text-[#56288A]">{doc.name || doc.document_type}</h4>
            
            {doc.validityPeriod && (
              <p className="text-sm font-medium text-gray-700 mb-3">
                Validity: {doc.validityPeriod}
              </p>
            )}

            {doc.mandatory !== undefined && (
              <p className="text-sm font-medium mb-3">
                <span className={`px-2 py-1 rounded-full ${
                  doc.mandatory 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {doc.mandatory ? 'Required' : 'Optional'}
                </span>
              </p>
            )}
            
            {(doc.requirements && doc.requirements.length > 0) && (
              <>
                <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#56288A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Requirements:
                </h5>
                <ul className="mb-3 text-sm list-disc list-inside">
                  {doc.requirements.map((requirement, i) => (
                    <li key={i} className="text-gray-600 my-1">{requirement}</li>
                  ))}
                </ul>
              </>
            )}
            
            {doc.processingTime && (
              <p className="text-sm text-gray-600 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#56288A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Processing Time:</span> {doc.processingTime}
              </p>
            )}
            
            {doc.note && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-sm italic text-gray-600 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {doc.note}
                </p>
              </div>
            )}
          </Card>
        )) : (
          <div className="col-span-3 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
            <p>No document recommendations available.</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-700 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <span className="font-medium">Disclaimer:</span> Always verify current document requirements with official government sources or your travel agent before traveling. Requirements may change without notice.
          </span>
        </p>
      </div>
    </div>
  );
}

export default LegalDocRecommendations; 