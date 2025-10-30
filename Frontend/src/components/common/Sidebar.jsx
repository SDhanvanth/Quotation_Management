// src/components/common/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HomeIcon,
  DocumentTextIcon,
  CubeIcon,
  UserGroupIcon,
  ChartBarIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
  FolderIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const getNavItems = () => {
    const userType = user?.UserType?.type_name?.toLowerCase();

    switch (userType) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin', icon: HomeIcon },
          { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
          { name: 'Stores', href: '/admin/stores', icon: BuildingStorefrontIcon },
          { name: 'Retailers', href: '/admin/retailers', icon: UserGroupIcon },
          { name: 'Items', href: '/admin/items', icon: CubeIcon },
          { name: 'Categories', href: '/admin/categories', icon: FolderIcon },
          { name: 'Quotations', href: '/admin/quotations', icon: DocumentTextIcon },
          { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
        ];
      case 'store':
        return [
          { name: 'Dashboard', href: '/store', icon: HomeIcon },
          { name: 'Stock', href: '/store/stock', icon: CubeIcon },
          { name: 'Stock Request', href: '/store/stock-request', icon: ShoppingCartIcon },
          { name: 'Reports', href: '/store/reports', icon: ChartBarIcon },
          { name: 'Profile', href: '/store/profile', icon: UserCircleIcon },
        ];
      case 'retailer':
        return [
          { name: 'Dashboard', href: '/retailer', icon: HomeIcon },
          { name: 'Quotations', href: '/retailer/quotations', icon: DocumentTextIcon },
          { name: 'Responses', href: '/retailer/responses', icon: ClipboardDocumentListIcon },
          { name: 'Profile', href: '/retailer/profile', icon: UserCircleIcon },
        ];
      default:
        console.warn('Unknown user type:', userType);
        return [];
    }
  };

  const navItems = getNavItems();

  const sidebarClasses = `fixed left-0 top-16 h-full bg-white shadow-lg transition-all duration-300 z-30 ${
    sidebarOpen ? 'w-64' : 'w-20'
  }`;

  return (
    <aside className={sidebarClasses}>
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href.split('/').length === 2}
                className={({ isActive }) => {
                  const baseClasses = 'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200';
                  const activeClasses = isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
                  return `${baseClasses} ${activeClasses}`;
                }}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;