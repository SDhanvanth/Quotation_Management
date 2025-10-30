import { Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import NotificationBell from '../ui/NotificationBell'
import { toggleSidebar } from '../../store/uiSlice'
import { logout } from '../../store/authSlice'
import authService from '../../services/auth.service'
import toast from 'react-hot-toast'

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = async () => {
    try {
      await authService.logout()
      dispatch(logout())
      navigate('/login')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">
              QuoteMaster
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {user?.UserType?.type_name === 'admin' && <NotificationBell />}

            {/* User Menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.UserType?.type_name}
                  </p>
                </div>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate(`/${user?.UserType?.type_name}/profile`)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5" />
                        Profile
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <Cog6ToothIcon className="mr-3 h-5 w-5" />
                        Settings
                      </button>
                    )}
                  </Menu.Item>
                  <hr className="my-1" />
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar