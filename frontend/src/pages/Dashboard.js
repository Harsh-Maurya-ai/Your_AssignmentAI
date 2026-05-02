import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardHome from '../components/DashboardHome';
import './Dashboard.css';

const Dashboard = () => {
  const [activePage, setActivePage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="dashboard-content">
          {activePage === 'home' && <DashboardHome />}
          {activePage !== 'home' && (
            <div className="coming-soon">
              <div className="coming-soon-icon">🚀</div>
              <h2>Coming in next steps!</h2>
              <p>This feature will be built in upcoming steps.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;