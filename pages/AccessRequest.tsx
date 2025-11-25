import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WifiIcon, ShareIcon } from '../components/Icons';

const AccessRequest: React.FC = () => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState<number>(4);
  const [unit, setUnit] = useState<'HOURS' | 'DAYS'>('HOURS');
  const [isSending, setIsSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = () => {
    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setOtpSent(true);
      
      // After a brief delay, navigate back to the PIN entry screen (simulating the next step)
      setTimeout(() => {
        navigate('/share', { 
            state: { 
                view: 'borrower', 
                step: 'pin',
                machineId: 'm1', // Hardcoded ID 'm1' for JRM 350 context in this prototype
                rentalDuration: duration,
                rentalUnit: unit
            } 
        });
      }, 2000);
    }, 1500);
  };

  const toggleUnit = (newUnit: 'HOURS' | 'DAYS') => {
    setUnit(newUnit);
    setDuration(1); // Reset duration when switching units for better UX
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in pb-20 pt-10 px-4 md:px-0 md:pt-24">
      {/* Header / Back */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/share')} 
          className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/20 transition-colors duration-300"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Access Request</h1>
          <p className="text-gray-500 text-sm">Configure rental terms</p>
        </div>
      </div>

      <div className="bg-jute-paper dark:bg-jute-darkPaper rounded-3xl p-6 md:p-8 shadow-soft border border-black/5 dark:border-white/5 relative overflow-hidden">
        
        {/* Machine Connected Card */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl flex items-center gap-4 mb-8 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                <WifiIcon size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">JRM 350</h2>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Connection Secure</span>
                </div>
            </div>
        </div>

        {!otpSent ? (
            <div className="space-y-8 animate-fade-in">
                {/* Duration Input */}
                <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">
                        Rental Duration
                    </label>

                    {/* Unit Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 dark:bg-black/20 p-1 rounded-xl flex">
                            <button
                                onClick={() => toggleUnit('HOURS')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${unit === 'HOURS' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                HOURS
                            </button>
                            <button
                                onClick={() => toggleUnit('DAYS')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${unit === 'DAYS' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                DAYS
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative flex items-center justify-center gap-6">
                        <button 
                            onClick={() => setDuration(Math.max(1, duration - 1))}
                            className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors active:scale-95"
                        >
                            -
                        </button>
                        
                        <div className="w-32 text-center">
                            <span className="text-6xl font-mono font-bold text-jute-darkBlue dark:text-white tracking-tighter">{duration}</span>
                            <span className="text-xs font-bold text-gray-400 block mt-2 tracking-widest uppercase">{unit}</span>
                        </div>

                        <button 
                            onClick={() => setDuration(duration + 1)}
                            className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors active:scale-95"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Send OTP Button */}
                <button 
                    onClick={handleSendOTP}
                    disabled={isSending}
                    className="w-full py-5 bg-jute-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl shadow-black/10 dark:shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                    {isSending ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           Requesting...
                        </>
                    ) : (
                        <>
                           Send OTP <ShareIcon size={20} />
                        </>
                    )}
                </button>
                <p className="text-center text-xs text-gray-400 px-4">
                    The owner will receive a request to generate an access PIN for this duration.
                </p>
            </div>
        ) : (
            <div className="py-10 text-center animate-fade-in">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2">Request Sent!</h3>
                <p className="text-gray-500 text-sm">Please wait for the owner to share the Access PIN.</p>
                <div className="mt-8 text-xs text-gray-400 animate-pulse">Redirecting to PIN entry...</div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AccessRequest;