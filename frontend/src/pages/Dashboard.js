import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardHome from '../components/DashboardHome';
import AssignmentGenerator from '../components/AssignmentGenerator';
import ParaphrasingTool from '../components/ParaphrasingTool';
import GrammarChecker from '../components/GrammarChecker';
import CitationGenerator from '../components/CitationGenerator';
import CodeExplainer from '../components/CodeExplainer';
import CodeDebugger from '../components/CodeDebugger';
import PseudocodeConverter from '../components/PseudocodeConverter';
import LabManualGenerator from '../components/LabManualGenerator';
import ReadmeGenerator from '../components/ReadmeGenerator';
import './Dashboard.css';

const BUILT_PAGES = [
  'home', 'assignment', 'paraphrase', 'grammar', 'citation',
  'code-explainer', 'debugger', 'pseudocode', 'lab-manual', 'readme'
];

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
          {activePage === 'assignment' && <AssignmentGenerator />}
          {activePage === 'paraphrase' && <ParaphrasingTool />}
          {activePage === 'grammar' && <GrammarChecker />}
          {activePage === 'citation' && <CitationGenerator />}
          {activePage === 'code-explainer' && <CodeExplainer />}
          {activePage === 'debugger' && <CodeDebugger />}
          {activePage === 'pseudocode' && <PseudocodeConverter />}
          {activePage === 'lab-manual' && <LabManualGenerator />}
          {activePage === 'readme' && <ReadmeGenerator />}
          {!BUILT_PAGES.includes(activePage) && (
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