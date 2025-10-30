import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '../../components/forms/Button'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center px-4"
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            NEC INVENTORY MANAGEMENT
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Digitalizing Quotation Management Process
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg text-gray-700 mb-12 max-w-xl mx-auto"
        >
          Simplify procurement, manage suppliers, and track inventory all in one place.
          Built for modern businesses that value efficiency.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/login">
            <Button size="lg" variant="primary" className="min-w-[150px]">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="min-w-[150px]">
              Sign Up
            </Button>
          </Link>
        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-16 text-sm text-gray-500"
        >
          Developed by Student
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Home