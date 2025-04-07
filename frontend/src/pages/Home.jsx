import { Link } from 'react-router-dom'
import HowItWorks from './HowItWorks'
import { motion } from 'framer-motion'
import { Lightbulb, LogIn, PlaneTakeoff, Globe, Map, Users } from "lucide-react";
import balloon from "../assets/balloon.svg"; // Adjust path as needed

import "./HeroSection.css"; // <-- We'll write the float animation here

function Home() {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      
    <section className="bg-gradient-to-br from-[#F6F0FF] via-[#F0E6FF] to-[#E6F0FF] py-20 mb-10 flex items-center justify-center px-6 md:px-10">
      <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-16">
        {/* Left Column */}
        <motion.div 
          className="w-full md:w-1/2 text-center md:text-left"
          variants={fadeIn}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-7xl font-extrabold leading-tight text-gray-900 mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#56288A] to-[#864BD8]">Safar:</span><br />
              Your Journey,<br />
              <span className="text-[#56288A]">Your Way</span>
            </h1>
          </motion.div>
          <motion.p 
            className="text-lg md:text-xl text-gray-700 mb-10 max-w-xl mx-auto md:mx-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Plan personalized travel experiences, collaborate with friends, and
            explore new places—exactly the way you want.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10 md:justify-start"
            variants={staggerChildren}
          >
            <motion.div variants={fadeIn}>
              <Link
                to="/register"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg btn-pulse transition-all"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Link
                to="/about"
                className="glass-card text-indigo-600 border border-indigo-200 px-8 py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all"
              >
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Column: Animated Balloon */}
        <motion.div 
          className="w-full md:w-1/2 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={balloon}
            alt="Balloon"
            className="w-80 md:w-96 floating-balloon balloon-tint"
          />
        </motion.div>
      </div>
    </section>

      <HowItWorks />

      {/* Features Section */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-white via-[#F6F0FF] to-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#56288A] to-[#864BD8]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Plan Your Perfect Journey
          </motion.h2>
          <motion.p 
            className="text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Our platform gives you all the tools you need to create, manage, and share
            your travel plans with elegance and precision.
          </motion.p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-6"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeIn} className="glass-card p-8 rounded-2xl">
            <div className="h-14 w-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <PlaneTakeoff className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Easy Planning</h3>
            <p className="text-gray-600">
              Create detailed day-by-day itineraries with our intuitive interface.
              Add activities, accommodations, and transportation.
            </p>
          </motion.div>

          <motion.div variants={fadeIn} className="glass-card p-8 rounded-2xl">
            <div className="h-14 w-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Seamless Collaboration</h3>
            <p className="text-gray-600">
              Share your itineraries with friends and family. Plan together in real-time
              and make group decisions effortlessly.
            </p>
          </motion.div>

          <motion.div variants={fadeIn} className="glass-card p-8 rounded-2xl">
            <div className="h-14 w-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Map className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Interactive Maps</h3>
            <p className="text-gray-600">
              Visualize your journey with interactive maps. Plot your routes and
              discover nearby attractions and points of interest.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center max-w-4xl mx-auto px-6">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to Start Your Adventure?
          </motion.h2>
          <motion.p 
            className="text-xl mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Join thousands of travelers who plan their perfect journeys with Safar.
            Your next unforgettable experience awaits.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link
              to="/register"
              className="glass px-8 py-4 rounded-xl font-medium text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300 btn-pulse"
            >
              Begin Your Safar Journey
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  )
}

export default Home 