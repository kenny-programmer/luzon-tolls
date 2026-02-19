import { useState, useEffect } from 'react';
import { Moon, Sun, User, ArrowUpDown, Car, Bus, Truck, MapPin, Navigation2, Calculator, Table, Coffee, ChevronDown, Copy, Check, X, Trash2 } from 'lucide-react';
import { TOLL_SYSTEM } from './lib/toll-data';
import { calculateTrip, TripSummary } from './lib/toll-calculator';
import { useTheme } from './contexts/ThemeContext';
import TollMatrix from './components/TollMatrix';
import ResultCard from './components/ResultCard';

type ViewMode = 'calculator' | 'matrix';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('calculator');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleClass, setVehicleClass] = useState<1 | 2 | 3>(1);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [error, setError] = useState('');
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{origin: string, destination: string, vehicleClass: 1 | 2 | 3}>>([]);

  const groupedExits = Object.entries(TOLL_SYSTEM)
    .map(([key, data]) => ({
      expressway: data.name,
      fullName: data.fullName,
      exits: data.exits,
    }))
    .sort((a, b) => {
      if (a.expressway.includes('SLEX') && !b.expressway.includes('SLEX')) return -1;
      if (!a.expressway.includes('SLEX') && b.expressway.includes('SLEX')) return 1;
      return 0;
    });

  const filteredOriginGroups = searchOrigin.trim() === '' 
    ? groupedExits 
    : groupedExits.map(group => {
        const searchLower = searchOrigin.toLowerCase();
        const matchesExpressway = group.expressway.toLowerCase().includes(searchLower) || 
                                  group.fullName.toLowerCase().includes(searchLower);
        const filteredExits = group.exits.filter(exit =>
          exit.toLowerCase().includes(searchLower)
        );
        if (matchesExpressway) return { ...group, exits: group.exits };
        return { ...group, exits: filteredExits };
      }).filter(group => group.exits.length > 0);

  const filteredDestinationGroups = searchDestination.trim() === '' 
    ? groupedExits 
    : groupedExits.map(group => {
        const searchLower = searchDestination.toLowerCase();
        const matchesExpressway = group.expressway.toLowerCase().includes(searchLower) || 
                                  group.fullName.toLowerCase().includes(searchLower);
        const filteredExits = group.exits.filter(exit =>
          exit.toLowerCase().includes(searchLower)
        );
        if (matchesExpressway) return { ...group, exits: group.exits };
        return { ...group, exits: filteredExits };
      }).filter(group => group.exits.length > 0);

  useEffect(() => {
    const saved = localStorage.getItem('tollRecentSearches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed);
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  // Fixed Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showOriginDropdown && !target.closest('[data-dropdown="origin"]')) {
        setShowOriginDropdown(false);
      }
      if (showDestinationDropdown && !target.closest('[data-dropdown="destination"]')) {
        setShowDestinationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOriginDropdown, showDestinationDropdown]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlOrigin = params.get('origin');
    const urlDestination = params.get('destination');
    const urlVehicleClass = params.get('vehicleClass');

    if (urlOrigin && urlDestination) {
      const vehicleClassNum = urlVehicleClass && ['1', '2', '3'].includes(urlVehicleClass) 
        ? parseInt(urlVehicleClass) as 1 | 2 | 3 
        : 1;
      
      setOrigin(urlOrigin);
      setSearchOrigin(urlOrigin);
      setDestination(urlDestination);
      setSearchDestination(urlDestination);
      setVehicleClass(vehicleClassNum);
      
      setTimeout(() => {
        const result = calculateTrip(urlOrigin, urlDestination, vehicleClassNum);
        if (result && result.legs.length > 0) {
          setTripSummary(result);
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (tripSummary && origin && destination) {
      const params = new URLSearchParams({
        origin,
        destination,
        vehicleClass: vehicleClass.toString(),
      });
      window.history.replaceState({}, '', `?${params.toString()}`);
    }
  }, [tripSummary, origin, destination, vehicleClass]);

  const handleClearInputs = () => {
    setOrigin('');
    setSearchOrigin('');
    setDestination('');
    setSearchDestination('');
    setTripSummary(null);
    setError('');
  };

  const handleCalculate = () => {
    setError('');
    setTripSummary(null);
    if (!origin || !destination) {
      setError('Please select both origin and destination');
      return;
    }
    if (origin === destination) {
      setError('Origin and destination cannot be the same');
      return;
    }

    const result = calculateTrip(origin, destination, vehicleClass);

    if (!result || result.legs.length === 0) {
      setError('No route found between selected locations');
      return;
    }

    setTripSummary(result);
    const newSearch = { origin, destination, vehicleClass };
    setRecentSearches(prev => {
      const filtered = prev.filter(s => 
        !(s.origin === origin && s.destination === destination && s.vehicleClass === vehicleClass)
      );
      const updated = [newSearch, ...filtered].slice(0, 4);
      localStorage.setItem('tollRecentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSwapLocations = () => {
    const tempOrigin = origin;
    const tempSearchOrigin = searchOrigin;
    setOrigin(destination);
    setSearchOrigin(searchDestination);
    setDestination(tempOrigin);
    setSearchDestination(tempSearchOrigin);
    setTripSummary(null);
  };

  const vehicleOptions = [
    { value: 1, label: 'Class 1', desc: 'Cars, SUVs, Vans', icon: Car },
    { value: 2, label: 'Class 2', desc: 'Buses, Medium Trucks', icon: Bus },
    { value: 3, label: 'Class 3', desc: 'Large Trucks, Trailers', icon: Truck },
  ];

  const popularRoutes = [
    { title: 'Manila → Baguio (TPLEX)', origin: 'Balintawak', destination: 'Rosario/Baguio', subtitle: 'Balintawak → Rosario', vehicleClass: 1 as const },
    { title: 'Manila → Subic (NLEX-SCTEX)', origin: 'Balintawak', destination: 'SCTEX Tipo/Subic', subtitle: 'Balintawak → Tipo/SFEX', vehicleClass: 1 as const },
    { title: 'Makati → Calamba (SLEX)', origin: 'Magallanes (SLEX)', destination: 'Calamba', subtitle: 'Magallanes (SLEX) → Calamba', vehicleClass: 1 as const },
    { title: 'Manila → Batangas Pier', origin: 'Balintawak', destination: 'Batangas', subtitle: 'Balintawak → Batangas', vehicleClass: 1 as const },
  ];

  const handleRecentSearch = (search: typeof recentSearches[0]) => {
    setOrigin(search.origin);
    setSearchOrigin(search.origin);
    setDestination(search.destination);
    setSearchDestination(search.destination);
    setVehicleClass(search.vehicleClass);
    setError('');
    const result = calculateTrip(search.origin, search.destination, search.vehicleClass);
    if (result && result.legs.length > 0) setTripSummary(result);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('tollRecentSearches');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl shadow-lg shrink-0">
              <Navigation2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Luzon Toll Calculator
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                SLEX · Skyway 3 · NLEX · SCTEX · TPLEX · STAR Tollway
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <a href="https://buymeacoffee.com/victorroxas" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold rounded-xl transition-all active:scale-95 shadow-lg text-xs sm:text-sm min-h-[44px]">
              <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Buy me a coffee</span>
            </a>
            <a href="https://victorroxas.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-lg text-xs sm:text-sm min-h-[44px]">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Developer</span>
            </a>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </header>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setViewMode('calculator')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${viewMode === 'calculator' ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <Calculator className="w-5 h-5" /> Calculator
          </button>
          <button onClick={() => setViewMode('matrix')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${viewMode === 'matrix' ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <Table className="w-5 h-5" /> Toll Matrix
          </button>
        </div>

        {viewMode === 'calculator' ? (
          <>
            <div className="text-center mb-6"><p className="text-sm text-slate-500 dark:text-slate-400">Estimates may vary from actual rates</p></div>

            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 md:p-10 mb-6 sm:mb-8">
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Vehicle Class</h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {vehicleOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button key={option.value} onClick={() => setVehicleClass(option.value as 1 | 2 | 3)} className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all active:scale-95 min-h-[100px] sm:min-h-[120px] ${vehicleClass === option.value ? 'bg-gradient-to-br from-indigo-600 to-cyan-600 border-transparent shadow-lg' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 ${vehicleClass === option.value ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
                        <p className={`text-xs sm:text-sm font-bold mb-0.5 ${vehicleClass === option.value ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{option.label}</p>
                        <p className={`text-[10px] sm:text-xs leading-tight ${vehicleClass === option.value ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{option.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative" style={{ zIndex: showOriginDropdown ? 50 : 20 }} data-dropdown="origin">
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entry Point</label>
                    <button onClick={handleClearInputs} className="text-[10px] sm:text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear Points</button>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <input
                      type="text"
                      value={showOriginDropdown ? searchOrigin : (origin || searchOrigin)}
                      onChange={(e) => { setSearchOrigin(e.target.value); if (origin) setOrigin(''); setShowOriginDropdown(true); }}
                      onFocus={() => setShowOriginDropdown(true)}
                      placeholder={origin ? '' : 'Select station...'}
                      className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowOriginDropdown(!showOriginDropdown); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1">
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showOriginDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showOriginDropdown && (
                      <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] max-h-64 overflow-y-auto">
                        {filteredOriginGroups.map((group) => (
                          <div key={group.expressway}>
                            <div className="sticky top-0 bg-slate-100 dark:bg-slate-700 px-4 py-2.5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600 z-10">
                              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider truncate">{group.expressway}</div>
                            </div>
                            {group.exits.map((exit) => (
                              <button key={exit} onClick={() => { setOrigin(exit); setSearchOrigin(exit); setShowOriginDropdown(false); }} className="w-full text-left px-4 py-3 sm:py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-900 dark:text-white text-sm sm:text-base">{exit}</button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center" style={{ zIndex: 10 }}>
                  <button onClick={handleSwapLocations} disabled={!origin || !destination} className="p-2 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 dark:from-indigo-900/30 dark:to-cyan-900/30 hover:scale-110 transition-all disabled:opacity-50"><ArrowUpDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></button>
                </div>

                <div className="relative" style={{ zIndex: showDestinationDropdown ? 50 : 20 }} data-dropdown="destination">
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Exit Point</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <input
                      type="text"
                      value={showDestinationDropdown ? searchDestination : (destination || searchDestination)}
                      onChange={(e) => { setSearchDestination(e.target.value); if (destination) setDestination(''); setShowDestinationDropdown(true); }}
                      onFocus={() => setShowDestinationDropdown(true)}
                      placeholder={destination ? '' : 'Select station...'}
                      className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowDestinationDropdown(!showDestinationDropdown); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1">
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showDestinationDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showDestinationDropdown && (
                      <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] max-h-64 overflow-y-auto">
                        {filteredDestinationGroups.map((group) => (
                          <div key={group.expressway}>
                            <div className="sticky top-0 bg-slate-100 dark:bg-slate-700 px-4 py-2.5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600 z-10">
                              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider truncate">{group.expressway}</div>
                            </div>
                            {group.exits.map((exit) => (
                              <button key={exit} onClick={() => { setDestination(exit); setSearchDestination(exit); setShowDestinationDropdown(false); }} className="w-full text-left px-4 py-3 sm:py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-900 dark:text-white text-sm sm:text-base">{exit}</button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={handleCalculate} className="w-full mt-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"><Calculator className="w-6 h-6" /> Calculate Toll Fee</button>
              {error && <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">{error}</div>}
            </div>

            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Searches</h2>
                  <button onClick={handleClearRecentSearches} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"><X className="w-3 h-3" /> Clear History</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentSearches.map((search, index) => (
                    <button key={index} onClick={() => handleRecentSearch(search)} className="text-left p-4 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 transition-all active:scale-[0.98]">
                      <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">{search.origin} → {search.destination}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Class {search.vehicleClass}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Popular Routes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {popularRoutes.map((route, index) => (
                  <button key={index} onClick={() => handleRecentSearch(route as any)} className="text-left p-4 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 transition-all active:scale-[0.98]">
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 truncate">{route.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Class {route.vehicleClass}</p>
                  </button>
                ))}
              </div>
            </div>

            {tripSummary && <ResultCard tripSummary={tripSummary} origin={origin} destination={destination} vehicleClass={vehicleClass} />}
          </>
        ) : (
          <TollMatrix />
        )}

        <footer className="mt-16 pt-8 border-t-2 border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Source: Toll Regulatory Board · Last updated: February 19, 2026</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Created by <a href="https://victorroxas.vercel.app/" target="_blank" className="font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent hover:underline">Victor Roxas</a></p>
        </footer>
      </div>
    </div>
  );
}

export default App;