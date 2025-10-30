import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const Layout = () => {
  const { sidebarOpen } = useSelector((state) => state.ui)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-20'
          }`}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout