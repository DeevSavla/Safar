import React from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaMapMarkerAlt, FaUsers, FaLightbulb, FaHeart } from 'react-icons/fa';

function About() {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.6,
        type: "spring",
        stiffness: 100 
      }
    }
  };

  const valueCardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.5
      }
    },
    hover: {
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      transition: { 
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto py-16 px-4 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="text-center mb-16"
        variants={itemVariants}
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#56288A] to-[#864BD8]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          About Safar
        </motion.h1>
        <motion.div 
          className="w-24 h-1 bg-gradient-to-r from-[#56288A] to-[#864BD8] mx-auto mb-6"
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <motion.p 
          className="text-xl text-gray-600 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          Your journey towards better travel planning starts here
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center"
        variants={itemVariants}
      >
        <div className="order-2 md:order-1">
          <motion.div 
            className="bg-gradient-to-r from-[#56288A]/10 to-[#864BD8]/10 p-1 rounded-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl p-8 shadow-sm border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-[#56288A]">
                <FaLightbulb className="mr-3 text-[#864BD8]" /> 
                Our Mission
              </h2>
              <p className="text-lg leading-relaxed mb-6 text-gray-700">
                At Safar, we believe that the best trips are the ones that are well-planned
                but leave room for spontaneity. Our mission is to simplify the travel planning process,
                making it more collaborative and enjoyable, so you can focus on creating unforgettable
                memories.
              </p>
              <p className="text-lg leading-relaxed text-gray-700">
                Whether you're a solo adventurer, a couple on a romantic getaway, or a family planning
                the annual vacation, our platform provides the tools you need to create the perfect itinerary,
                stay organized, and make the most of your travel experience.
              </p>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="order-1 md:order-2 flex justify-center"
          animate={{ 
            y: [0, 15] 
          }}
          transition={{ 
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.5,
            ease: "easeInOut" 
          }}
        >
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-[#56288A]/10 to-[#864BD8]/10" />
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full bg-gradient-to-r from-[#56288A]/20 to-[#864BD8]/20" />
            <div className="absolute flex items-center justify-center inset-0">
              <FaPlane className="text-[#56288A] text-7xl transform -rotate-45" />
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center"
        variants={itemVariants}
      >
        <motion.div 
          className="flex justify-center"
          animate={{ 
            rotate: [-5, 5]
          }}
          transition={{ 
            repeat: Infinity,
            repeatType: "reverse",
            duration: 2,
            ease: "easeInOut" 
          }}
        >
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-[#56288A]/10 to-[#864BD8]/10" />
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full bg-gradient-to-r from-[#56288A]/20 to-[#864BD8]/20" />
            <div className="absolute flex items-center justify-center inset-0">
              <FaMapMarkerAlt className="text-[#56288A] text-7xl" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-to-r from-[#56288A]/10 to-[#864BD8]/10 p-1 rounded-2xl">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-[#56288A]">
                <FaHeart className="mr-3 text-[#864BD8]" /> 
                Our Story
              </h2>
              <p className="text-lg leading-relaxed mb-6 text-gray-700">
                Safar was born out of frustration with the existing travel planning tools.
                As avid travelers ourselves, we found that coordinating trips with friends and family
                was often a chaotic experience involving multiple spreadsheets, countless messaging apps,
                and fragmented information.
              </p>
              <p className="text-lg leading-relaxed text-gray-700">
                We set out to create a comprehensive platform that combines powerful planning features
                with a simple, intuitive interface. After months of development and testing, Safar
                was launched with the goal of revolutionizing how people plan and experience travel.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <motion.h2 
          className="text-3xl font-bold mb-12 text-center text-[#56288A]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          Our Values
        </motion.h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          <motion.div 
            className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300"
            variants={valueCardVariants}
            whileHover="hover"
          >
            <div className="bg-gradient-to-r from-[#56288A] to-[#864BD8] h-2" />
            <div className="p-8">
              <div className="w-16 h-16 rounded-full bg-[#56288A]/10 flex items-center justify-center mb-6 mx-auto">
                <FaLightbulb className="text-[#56288A] text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-[#56288A]">Simplicity</h3>
              <p className="text-gray-700 text-center">
                We believe in keeping things simple. Our platform is designed to be intuitive
                and easy to use, even for first-time travelers. We focus on removing complexity
                so you can focus on what matters most - your journey.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300"
            variants={valueCardVariants}
            whileHover="hover"
          >
            <div className="bg-gradient-to-r from-[#56288A] to-[#864BD8] h-2" />
            <div className="p-8">
              <div className="w-16 h-16 rounded-full bg-[#56288A]/10 flex items-center justify-center mb-6 mx-auto">
                <FaUsers className="text-[#56288A] text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-[#56288A]">Collaboration</h3>
              <p className="text-gray-700 text-center">
                Travel is better when shared. We've built our tools to make group planning
                seamless and enjoyable for everyone involved. From shared itineraries to 
                collaborative decision making, we bring people together.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300"
            variants={valueCardVariants}
            whileHover="hover"
          >
            <div className="bg-gradient-to-r from-[#56288A] to-[#864BD8] h-2" />
            <div className="p-8">
              <div className="w-16 h-16 rounded-full bg-[#56288A]/10 flex items-center justify-center mb-6 mx-auto">
                <FaMapMarkerAlt className="text-[#56288A] text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-[#56288A]">Adventure</h3>
              <p className="text-gray-700 text-center">
                We encourage exploration and new experiences. Our platform helps you discover
                hidden gems and create unique itineraries that take you off the beaten path
                and into the heart of authentic travel experiences.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="mt-20 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1 }}
      >
        <p className="text-[#56288A] text-lg font-medium">Ready to start your journey?</p>
        <motion.button 
          className="mt-4 px-8 py-3 bg-gradient-to-r from-[#56288A] to-[#864BD8] text-white font-medium rounded-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Plan Your Trip Now
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default About; 