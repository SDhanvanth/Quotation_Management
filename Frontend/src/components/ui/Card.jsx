import { motion } from 'framer-motion'

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  padding = true,
  onClick,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-lg transition-all duration-200'
  const paddingClasses = padding ? 'p-6' : ''
  const cursorClasses = onClick ? 'cursor-pointer' : ''
  
  const cardClasses = `${baseClasses} ${paddingClasses} ${cursorClasses} ${className}`

  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } : {}}
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card