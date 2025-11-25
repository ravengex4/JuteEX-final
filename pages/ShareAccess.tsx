import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShareIcon, QRIcon, WifiIcon, PlayIcon, StopIcon } from '../components/Icons';
import { mockBackend } from '../services/mockBackend';
import { useApp } from '../App';
import { Machine } from '../types';

const SharedMachineCard: React.FC<{ machine: Machine }> = ({ machine }) => {
  const isRunning = machine.status === 'RUNNING';
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(80);
    mockBackend.toggleMachineState(machine.id);
  };

  const formatRuntime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-lg mb-8 relative overflow-hidden animate-fade-in">
      {/* Status Banner */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500" />
      
      <div className="flex items-start justify-between mb-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Active Rental Monitor</span>
           </div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mt-1">{machine.name}</h3>
           <p className="text-sm text-gray-500 mt-0.5">Borrower: <span className="font-bold text-gray-900 dark:text-gray-300">{machine.rentalSession?.renterId || 'Guest User'}</span></p>
        </div>
        
        {/* ON/OFF Toggle */}
        <div className="flex flex-col items-end">
            <button
                onClick={handleToggle}
                className={`
                    relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none shadow-inner
                    ${isRunning ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                `}
            >
                <div className={`
                    absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center
                    ${isRunning ? 'translate-x-6' : 'translate-x-0'}
                `}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isRunning ? 'text-green-500' : 'text-gray-400'}>
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                        <line x1="12" y1="2" x2="12" y2="12" />
                     </svg>
                </div>
            </button>
            <span className="text-[9px] font-bold uppercase text-gray-400 mt-1 tracking-wider">{isRunning ? 'System ON' : 'System OFF'}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
             <div className="text-[9px] uppercase text-gray-400 font-bold mb-1 tracking-wider">Runtime</div>
             <div className="text-base font-mono font-bold text-gray-800 dark:text-gray-200">{formatRuntime(machine.telemetry.runtime)}</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
             <div className="text-[9px] uppercase text-gray-400 font-bold mb-1 tracking-wider">Motor Temp</div>
             <div className={`text-base font-mono font-bold ${machine.telemetry.motorTemp > 80 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                 {Math.round(machine.telemetry.motorTemp)}°C
             </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
             <div className="text-[9px] uppercase text-gray-400 font-bold mb-1 tracking-wider">Mode</div>
             <div className="text-base font-bold text-blue-500">{machine.currentMode}</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
             <div className="text-[9px] uppercase text-gray-400 font-bold mb-1 tracking-wider">Power Draw</div>
             <div className="text-base font-mono font-bold text-gray-800 dark:text-gray-200">{machine.telemetry.current}A</div>
          </div>
      </div>
      
      {/* Footer / Disclaimer */}
      <div className="mt-4 flex items-start gap-3 text-[10px] text-gray-500 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
          <div className="shrink-0 mt-0.5 opacity-50"><ShareIcon size={14} /></div>
          <span>Owner Override Active. You can safely stop the machine in emergencies, but speed and mode settings are locked to the borrower.</span>
      </div>
    </div>
  );
};

const ShareAccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { machines } = useApp();
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [activeTab, setActiveTab] = useState<'owner' | 'borrower'>('owner');
  const [borrowerStep, setBorrowerStep] = useState<'scan' | 'pin'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const rentedMachines = machines.filter(m => m.rentalSession);

  // Check for navigation state returning from OTP request
  useEffect(() => {
    if (location.state && (location.state as any).view === 'borrower') {
      setActiveTab('borrower');
      if ((location.state as any).step === 'pin') {
        setBorrowerStep('pin');
      }
    }
  }, [location.state]);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Redirect to the new Access Request page instead of going directly to PIN
      navigate('/access-request');
    }, 1500);
  };

  const handleStartSession = async () => {
    // Basic PIN validation check
    if (pin.some(d => d === '')) return;

    setIsValidating(true);
    
    // Extract rental info from navigation state
    // Default to 'm1' (JRM 350) and 4 hours if state is missing
    const state = location.state as any || {};
    const machineId = state.machineId || 'm1';
    const duration = state.rentalDuration || 4;
    const unit = state.rentalUnit || 'HOURS';

    // Call backend to log rental
    await mockBackend.startRental(machineId, duration, unit);

    // Simulate network delay for effect then redirect
    setTimeout(() => {
        setIsValidating(false);
        navigate(`/run/${machineId}`);
    }, 1500);
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in pb-20 pt-10 md:pt-24">
      <div className="bg-jute-paper dark:bg-jute-darkPaper rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-soft border border-black/5 dark:border-white/5">
        
        {/* Toggle */}
        <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-2xl mb-8">
          <button 
            className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'owner' ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-gray-400'}`}
            onClick={() => { setActiveTab('owner'); setBorrowerStep('scan'); }}
          >
            Owner
          </button>
          <button 
            className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'borrower' ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-gray-400'}`}
            onClick={() => { setActiveTab('borrower'); setBorrowerStep('scan'); }}
          >
            Borrower
          </button>
        </div>

        {activeTab === 'owner' ? (
          <div className="space-y-6">
            {/* OTP Section at Top */}
            <div className="bg-white dark:bg-black/40 rounded-2xl p-6 text-center border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jute-darkBlue to-blue-400"></div>
                
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold flex items-center justify-center gap-2">
                    Access PIN <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                </div>
                
                <div className="text-5xl font-mono font-bold tracking-widest text-jute-darkBlue dark:text-jute-lightBlue mb-2">829 401</div>
                
                <div className="flex items-center justify-center gap-2 text-xs text-red-500 font-medium mb-6">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Expires in 14m 20s
                </div>

                <button className="w-full py-3 bg-gray-50 dark:bg-white/5 text-jute-black dark:text-white rounded-xl font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-gray-200 dark:border-white/10">
                    Regenerate PIN
                </button>
            </div>

            {/* Rented Machines Status */}
            {rentedMachines.length > 0 && (
                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 px-1">
                        <ShareIcon size={16} className="text-gray-400"/>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Rentals</h3>
                    </div>
                    {rentedMachines.map(m => <SharedMachineCard key={m.id} machine={m} />)}
                </div>
            )}

            {/* Context/Info Section */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-white/10 opacity-60">
                <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto">Share the PIN above with a borrower to grant temporary control access.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 min-h-[300px] flex flex-col justify-center">
             {borrowerStep === 'scan' ? (
               <div className="space-y-6 animate-fade-in">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">Authenticate</h2>
                    <p className="text-gray-500 text-sm mt-2">Tap NFC card or Scan QR to verify machine proximity.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={simulateScan}
                      className="aspect-square bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 transition-all group active:scale-95"
                    >
                      <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <WifiIcon size={24} />
                      </div>
                      <span className="font-bold text-sm">Tap NFC</span>
                    </button>

                    <button 
                      onClick={simulateScan}
                      className="aspect-square bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 transition-all group active:scale-95"
                    >
                      <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <QRIcon size={24} />
                      </div>
                      <span className="font-bold text-sm">Scan QR</span>
                    </button>
                  </div>

                  {isScanning && (
                    <div className="text-center text-sm font-bold text-blue-500 animate-pulse">
                      Verifying Machine Identity...
                    </div>
                  )}
               </div>
             ) : (
               <div className="animate-fade-in">
                 <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold mb-4">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      OTP Request Sent
                    </div>
                    <h2 className="text-2xl font-bold">Enter Access PIN</h2>
                    <p className="text-gray-500 text-sm mt-2">Enter the 6-digit PIN shared by the owner.</p>
                 </div>

                 <div className="flex justify-center gap-1 md:gap-2 mb-8">
                   {pin.map((digit, idx) => (
                     <input
                       key={idx}
                       id={`pin-${idx}`}
                       type="text"
                       inputMode="numeric"
                       maxLength={1}
                       value={digit}
                       onChange={(e) => handlePinChange(idx, e.target.value)}
                       className="w-10 h-14 md:w-12 md:h-16 text-center text-xl md:text-2xl font-bold bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus:border-jute-darkBlue focus:ring-2 focus:ring-jute-darkBlue/20 outline-none transition-all dark:text-white"
                     />
                   ))}
                 </div>

                 <button 
                    onClick={handleStartSession}
                    disabled={isValidating}
                    className="w-full py-4 bg-jute-darkBlue text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-transform shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                 >
                     {isValidating ? (
                        <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying Access...
                        </>
                     ) : (
                        'Start Session'
                     )}
                 </button>
                 
                 <button 
                   onClick={() => setBorrowerStep('scan')}
                   className="w-full mt-4 py-2 text-gray-400 text-xs font-bold hover:text-gray-600"
                   disabled={isValidating}
                 >
                   Cancel Verification
                 </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareAccess;