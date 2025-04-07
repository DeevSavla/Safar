import { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card } from './ui/card';
import Loader from './Loader';
import { motion } from 'framer-motion';

function CreditCardRecommendations({ destination }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!destination) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try both environment variable options
        const apiKey = import.meta.env.VITE_GEMINI_KEY || import.meta.env.GEMINI_KEY || "AIzaSyCMwuKcohq5uYsjFnMTddXSm0JRwXusPXk";
        if (!apiKey) {
          throw new Error("Missing Gemini API key");
        }
        
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const prompt = `
          As a travel financial advisor, recommend the top 3 credit cards for traveling to ${destination}.
          For each card, provide:
          1. Card name
          2. Annual fee
          3. Key travel benefits (focus on points, lounge access, travel insurance)
          4. Why it's good for ${destination} specifically
          
          Strictly Format the response as a JSON array of objects with the following structure:
          "creditCards": [
            {
              "name": "Card Name",
              "annualFee": "$XXX",
              "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
              "destinationValue": "Explanation of why it's good for ${destination}"
            }
          ]
          
          Only return the JSON array, no additional text.
        `;
        
        
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
          });
        
        // Get the response text from the appropriate structure
        // The response object contains candidates array with parts that have the text
        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (!responseText) {
          throw new Error("Empty response from Gemini API");
        } else {
          console.log(responseText);
        }
        
        // Process the response text - remove markdown code formatting if present
        try {
          // Remove markdown code blocks if present
          let cleanedText = responseText.trim();
          
          // Remove ```json and ``` that may wrap the JSON content
          cleanedText = cleanedText.replace(/```json\s*|\s*```/g, '');
          
          console.log("Cleaned text:", cleanedText);
          
          // Try to parse the entire response as JSON
          const parsedResponse = JSON.parse(cleanedText);
          // Extract the credit cards array from the response if it exists
          const creditCards = parsedResponse.creditCards || parsedResponse;
          setRecommendations(creditCards);
        } catch (jsonError) {
          console.error("Error parsing cleaned JSON:", jsonError);
          
          // If direct parsing still fails, try to extract JSON from the response
          try {
            const jsonStart = responseText.indexOf('[');
            const jsonEnd = responseText.lastIndexOf(']') + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
              const jsonString = responseText.substring(jsonStart, jsonEnd);
              const parsedRecommendations = JSON.parse(jsonString);
              setRecommendations(parsedRecommendations);
            } else {
              // Try to find the creditCards property instead
              const creditCardsStart = responseText.indexOf('"creditCards":');
              if (creditCardsStart >= 0) {
                const objectStart = responseText.indexOf('[', creditCardsStart);
                const objectEnd = responseText.lastIndexOf(']') + 1;
                
                if (objectStart >= 0 && objectEnd > objectStart) {
                  const jsonString = responseText.substring(objectStart, objectEnd);
                  const parsedRecommendations = JSON.parse(jsonString);
                  setRecommendations(parsedRecommendations);
                } else {
                  throw new Error("Could not find creditCards array in response");
                }
              } else {
                throw new Error("Could not find JSON array in response");
              }
            }
          } catch (extractError) {
            console.error("Error parsing JSON from response:", extractError);
            throw new Error("Failed to parse credit card recommendations");
          }
        }
      } catch (err) {
        console.error("Error fetching credit card recommendations:", err);
        setError("Failed to get credit card recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecommendations();
  }, [destination]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      } 
    },
    hover: { 
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    },
    tap: { 
      scale: 0.98,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    }
  };
  
  const benefitItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 100 
      } 
    }
  };
  
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-[#56288A]/5 to-[#864BD8]/5 rounded-lg"
      >
        <motion.div 
          className="w-16 h-16 mb-4 text-[#56288A]"
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 2, ease: "linear" },
            scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </motion.div>
        <h3 className="text-lg font-medium mb-2 text-center text-[#56288A]">Finding the best credit cards for {destination}...</h3>
        <Loader size="small" />
      </motion.div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="p-6 bg-red-50 border border-red-100 text-red-700 rounded-lg shadow-sm"
      >
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium">Unable to fetch credit card recommendations</h3>
        </div>
        <p>{error}</p>
        <p className="mt-2 text-sm">Try refreshing the page or check your internet connection.</p>
      </motion.div>
    );
  }
  
  if (!recommendations || recommendations.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="p-6 bg-yellow-50 border border-yellow-100 text-yellow-700 rounded-lg shadow-sm"
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No credit card recommendations available for {destination}.</p>
        </div>
      </motion.div>
    );
  }
  
  return (
    <div>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {Array.isArray(recommendations) ? recommendations.map((card, index) => (
          <motion.div
            key={index}
            className="card-container"
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
            onHoverStart={() => setHoveredCard(index)}
            onHoverEnd={() => setHoveredCard(null)}
            layout
          >
            <Card className="overflow-hidden border-t-4 border-[#56288A] bg-white h-full">
              <motion.div 
                className="bg-gradient-to-r from-[#56288A]/10 to-[#864BD8]/10 p-4"
                animate={{
                  background: hoveredCard === index 
                    ? "linear-gradient(to right, rgba(86, 40, 138, 0.2), rgba(134, 75, 216, 0.2))" 
                    : "linear-gradient(to right, rgba(86, 40, 138, 0.1), rgba(134, 75, 216, 0.1))"
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.h4 
                  className="text-lg font-semibold text-[#56288A]"
                  animate={{ 
                    scale: hoveredCard === index ? 1.05 : 1,
                    x: hoveredCard === index ? 5 : 0
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {card.name}
                </motion.h4>
                <p className="text-sm font-medium text-gray-700 mt-1">{card.annualFee}</p>
              </motion.div>
              
              <div className="p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <motion.div
                    animate={{ 
                      rotate: hoveredCard === index ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  Key Benefits
                </h5>
                <motion.ul 
                  className="mb-4 text-sm space-y-1"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  {card.benefits.map((benefit, i) => (
                    <motion.li 
                      key={i} 
                      className="text-gray-600 flex items-start ml-2"
                      variants={benefitItemVariants}
                      custom={i}
                    >
                      <motion.span 
                        className="text-[#56288A] mr-2"
                        animate={{ 
                          scale: hoveredCard === index ? [1, 1.2, 1] : 1,
                        }}
                        transition={{ 
                          repeat: hoveredCard === index ? Infinity : 0, 
                          repeatDelay: 1,
                          duration: 0.3
                        }}
                      >
                        •
                      </motion.span>
                      <span>{benefit}</span>
                    </motion.li>
                  ))}
                </motion.ul>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <motion.div
                      animate={{ 
                        y: hoveredCard === index ? [0, -3, 0] : 0
                      }}
                      transition={{ 
                        repeat: hoveredCard === index ? Infinity : 0, 
                        repeatDelay: 2,
                        duration: 0.5
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#56288A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </motion.div>
                    Why it's good for {destination}:
                  </h5>
                  <motion.p 
                    className="text-sm text-gray-600"
                    initial={{ opacity: 0.9 }}
                    animate={{ 
                      opacity: hoveredCard === index ? 1 : 0.9,
                      x: hoveredCard === index ? 3 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {card.destinationValue}
                  </motion.p>
                </div>
              </div>
              
              {hoveredCard === index && (
                <motion.div 
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute top-0 right-0 m-2">
                    <motion.div 
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-[#56288A]/10"
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#56288A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )) : 
        <motion.div 
          className="col-span-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p>No credit card recommendations available.</p>
        </motion.div>}
      </motion.div>
      
      <motion.div 
        className="mt-6 text-sm text-gray-500 italic"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <p className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Disclaimer: These recommendations are provided for informational purposes only. Please check with each card issuer for current terms and conditions.
        </p>
      </motion.div>
    </div>
  );
}

export default CreditCardRecommendations; 