import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './utils_auth';
import { getAllReports, getStatistics, getReportsByDistrict, getReportsByStatus } from './utils_api';
import Navbar from './components_Navbar';
import Stats from './components_Stats';
import ReportCard from './components_ReportCard';
import ReportForm from './components_ReportForm';

// Main application component
const MainApp = () => {
  const { isAuthenticated, isInitializing, principal } = useAuth();
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    reportedCount: 0,
    cleanedCount: 0,
    districtStats: []
  });
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data when component mounts
  useEffect(() => {
    if (!isInitializing) loadData();
  }, [isInitializing]);

  // Load data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load statistics
      const statsData = await getStatistics();
      setStats(statsData);
      
      // Load reports based on filters
      let reportsData = [];
      
      if (selectedDistrict === 'all' && selectedStatus === 'all') {
        reportsData = await getAllReports(20, 0);
      } else if (selectedDistrict !== 'all' && selectedStatus === 'all') {
        const districtVariant = { [selectedDistrict]: null };
        reportsData = await getReportsByDistrict(districtVariant);
      } else if (selectedDistrict === 'all' && selectedStatus !== 'all') {
        const statusVariant = { [selectedStatus]: null };
        reportsData = await getReportsByStatus(statusVariant);
      } else {
        // Combined filters implemented client-side
        const districtVariant = { [selectedDistrict]: null };
        const reportsForDistrict = await getReportsByDistrict(districtVariant);
        
        reportsData = reportsForDistrict.filter(report => {
          const statusKey = Object.keys(report.status)[0];
          return statusKey === selectedStatus;
        });
      }
      
      setReports(reportsData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Handle district selection
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    loadFilteredData(district, selectedStatus);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    loadFilteredData(selectedDistrict, newStatus);
  };

  // Load data with specific filter values
  const loadFilteredData = async (district, status) => {
    try {
      setLoading(true);
      
      let reportsData = [];
      
      if (district === 'all' && status === 'all') {
        reportsData = await getAllReports(20, 0);
      } else if (district !== 'all' && status === 'all') {
        const districtVariant = { [district]: null };
        reportsData = await getReportsByDistrict(districtVariant);
      } else if (district === 'all' && status !== 'all') {
        const statusVariant = { [status]: null };
        reportsData = await getReportsByStatus(statusVariant);
      } else {
        const districtVariant = { [district]: null };
        const reportsForDistrict = await getReportsByDistrict(districtVariant);
        
        reportsData = reportsForDistrict.filter(report => {
          const statusKey = Object.keys(report.status)[0];
          return statusKey === status;
        });
      }
      
      setReports(reportsData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Districts data
  const districts = [
    { id: 'central', name: 'Central Jakarta' },
    { id: 'west', name: 'West Jakarta' },
    { id: 'south', name: 'South Jakarta' },
    { id: 'east', name: 'East Jakarta' },
    { id: 'north', name: 'North Jakarta' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <header 
      className="relative bg-cover bg-center text-white py-16"
      style={{
      backgroundImage: `linear-gradient(rgba(13, 148, 136, 0.7), rgba(13, 148, 136, 0.7)), url('https://lingkunganhidup.jakarta.go.id/images/home/layanankami/Amdal.jpeg')`,
      backgroundBlendMode: 'multiply',
      backgroundSize: '120%'
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Clean City Together</h1>
          <p className="mb-6 max-w-lg mx-auto">
            Report abandoned waste in your area and help create a cleaner, healthier city.
          </p>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                alert('Please login first to report waste');
                return;
              }
              setIsReportFormOpen(true);
            }}
            className="bg-white text-teal-600 hover:bg-gray-100 px-5 py-2 rounded font-medium shadow-sm"
          >
            Report Waste
          </button>
        </div>
      </header>

      {/* Stats */}
      <Stats stats={stats} />

      {/* District Buttons */}
      <div className="container mx-auto px-4 py-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Waste by District
        </h2>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            className={`px-4 py-2 ${
              selectedDistrict === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-100 text-teal-800'
            } rounded hover:bg-teal-600 hover:text-white shadow-sm`}
            onClick={() => handleDistrictSelect('all')}
          >
            All Districts
          </button>
          {districts.map((district) => (
            <button
              key={district.id}
              className={`px-4 py-2 ${
                selectedDistrict === district.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-teal-100 text-teal-800'
              } rounded hover:bg-teal-600 hover:text-white shadow-sm`}
              onClick={() => handleDistrictSelect(district.id)}
            >
              {district.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">
            Waste Reports
          </h2>
          <div className="flex space-x-2">
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={handleStatusFilterChange}
              className="border border-gray-300 rounded px-3 py-1 text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="cleaned">Cleaned</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-36 bg-gray-200"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <button 
              onClick={loadData}
              className="mt-2 bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600"
            >
              Try Again
            </button>
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(report => (
              <ReportCard 
                key={report.id} 
                report={report} 
                onAction={loadData}
                principal={principal}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No reports found. 
            {isAuthenticated ? (
              <button 
                onClick={() => setIsReportFormOpen(true)}
                className="ml-2 text-teal-600 hover:underline"
              >
                Create a new report
              </button>
            ) : (
              <span> Please login to create a report.</span>
            )}
          </div>
        )}
      </div>

      {/* How It Works */}
<div 
  className="container mx-auto px-4 py-16 mt-8 rounded-lg shadow-md relative overflow-hidden"
  style={{
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)), url('https://lingkunganhidup.jakarta.go.id/uploads/70327-2025-03-28-01-55-25.jpeg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
>
  <h2 className="text-2xl font-bold text-gray-800 text-center mb-10 relative">
    <span className="relative z-10">Our Simple Process</span>
    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-24 bg-teal-500 rounded-full"></span>
  </h2>
  
  <div className="flex flex-col md:flex-row gap-8 relative">
    {/* Connector line (only visible on desktop) */}
    <div className="hidden md:block absolute top-16 left-0 w-full h-1 bg-teal-200 z-0"></div>
    
    {/* Report Card */}
    <div className="flex-1 text-center px-6 py-8 rounded-xl bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-2 z-10 border border-gray-100">
      <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-5 shadow-md">
        <span className="text-3xl">📸</span>
      </div>
      <h3 className="font-semibold text-lg mb-3 text-teal-700">Report</h3>
      <p className="text-gray-600">
        Snap a photo of waste in your neighborhood. Your location is automatically verified with GPS technology for accuracy.
      </p>
    </div>
    
    {/* Verify Card */}
    <div className="flex-1 text-center px-6 py-8 rounded-xl bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-2 z-10 border border-gray-100">
      <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-5 shadow-md">
        <span className="text-3xl">✅</span>
      </div>
      <h3 className="font-semibold text-lg mb-3 text-teal-700">Verify</h3>
      <p className="text-gray-600">
        Community members confirm reports through our secure blockchain verification system, ensuring complete transparency.
      </p>
    </div>
    
    {/* Clean Card */}
    <div className="flex-1 text-center px-6 py-8 rounded-xl bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-2 z-10 border border-gray-100">
      <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-5 shadow-md">
        <span className="text-3xl">🧹</span>
      </div>
      <h3 className="font-semibold text-lg mb-3 text-teal-700">Clean</h3>
      <p className="text-gray-600">
        Our community works together to resolve the issue, with real-time updates showing progress every step of the way.
      </p>
    </div>
  </div>
  
  <div className="text-center mt-12">
    <button className="bg-teal-600 text-white hover:bg-teal-700 px-8 py-3 rounded-full font-medium shadow-sm transition-all duration-300 flex items-center mx-auto">
      <span>Join the Movement</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </div>
</div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <div className="text-lg font-bold mb-1">🥷 Clean Ninja</div>
              <p className="text-sm text-gray-400">
                Blockchain-based waste reporting platform
              </p>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-gray-400">Powered by</div>
              <div className="font-medium">Internet Computer Protocol</div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-4 pt-4 text-center text-sm text-gray-400">
            <p>© 2025 Clean Ninja. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Report Form Modal */}
      {isReportFormOpen && (
        <ReportForm 
          isOpen={isReportFormOpen}
          onClose={() => setIsReportFormOpen(false)}
          onReportCreated={loadData}
        />
      )}
    </div>
  );
};

// Wrap MainApp with AuthProvider
const App = () => (
  <AuthProvider>
    <MainApp />
  </AuthProvider>
);

export default App;