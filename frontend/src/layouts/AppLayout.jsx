import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import TopNav from '../components/TopNav.jsx';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <TopNav />
        <Outlet />
      </div>
    </div>
  );
}
