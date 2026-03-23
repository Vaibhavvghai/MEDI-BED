import { useState } from 'react';
import { useStore } from '../store';

export const PrivacyCode = () => {
  const [code, setCode] = useState(['', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, setActivePatient } = useStore();

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value !== '' && index < 2) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleUnlock = async () => {
    const privacyCode = code.join('');
    if (privacyCode.length !== 3) return;

    try {
      setError('');
      setSuccess('');
      const res = await fetch('http://localhost:5000/api/doctor/unlock-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ privacyCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlock');

      setSuccess('Patient Unlocked for 30m');
      setActivePatient(data.patient);
    } catch (err: any) {
      setError(err.message);
      // Red Shake animation could be handled by adding a class here
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card p-6 border border-gray-100 flex flex-col items-center justify-center">
      <h3 className="font-semibold mb-2 text-primary-deep">Unlock Patient Record</h3>
      <p className="text-sm text-gray-500 mb-4 text-center">Enter 3-digit privacy code to access full records</p>
      
      <div className={`flex gap-2 ${error ? 'animate-pulse' : ''}`}>
        {[0, 1, 2].map((i) => (
          <input 
            key={i} 
            id={`code-${i}`}
            type="text" 
            maxLength={1} 
            value={code[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyUp={(e) => e.key === 'Backspace' && !code[i] && i > 0 && document.getElementById(`code-${i - 1}`)?.focus()}
            className="w-12 h-14 text-center text-xl font-display font-semibold border border-gray-200 rounded-xl focus:outline-none focus:border-primary-violet" 
          />
        ))}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      {success && <p className="text-green-500 text-sm mt-3">{success}</p>}

      <button
        onClick={handleUnlock}
        className="mt-4 bg-primary-violet hover:bg-primary-deep text-white px-6 py-2 rounded-xl text-sm transition-colors"
      >
        Unlock
      </button>
    </div>
  );
};
