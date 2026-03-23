import { useState } from 'react';
import { useStore } from '../store';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'doctor' | 'admin' | 'patient'>('doctor');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [hospitalId, setHospitalId] = useState('1'); // Default for demo
  const [specialty, setSpecialty] = useState('General');
  const [schedule, setSchedule] = useState('Mon-Fri 9AM-5PM');
  const [phone, setPhone] = useState('9999999999');
  const [privacyCode, setPrivacyCode] = useState('123'); // 3 digits
  const [bloodType, setBloodType] = useState('O+');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');

  const [error, setError] = useState('');
  const { setToken, setActiveUser } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? `/api/auth/login/${role}` : `/api/auth/signup/${role}`;
    
    let bodyData: any = { email, password, name, hospitalId };
    
    if (!isLogin && role === 'doctor') {
      bodyData = { ...bodyData, specialty, schedule, phone };
    } else if (!isLogin && role === 'patient') {
      bodyData = { ...bodyData, phone, privacyCode, bloodType, dateOfBirth };
    }

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${isLogin ? 'Login' : 'Signup'} failed`);

      const userObj = { ...data[role], role: role.toUpperCase() };
      setToken(data.token);
      setActiveUser(userObj); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 p-4 font-sans overflow-auto py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-card shadow-card border border-gray-100 mt-20">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary-violet flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
          <span className="font-display font-semibold text-2xl text-primary-deep">MediBed</span>
        </div>

        <h2 className="text-xl font-semibold text-center mb-2">
          {isLogin ? 'Sign In to Dashboard' : 'Create an Account'}
        </h2>
        
        <p className="text-sm text-center text-gray-500 mb-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary-violet underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>

        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          {(['doctor', 'admin', 'patient'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                role === r ? 'bg-white shadow-sm text-primary-violet' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary-violet focus:ring-1 focus:ring-primary-violet"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Details</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={`Enter ${role} email`}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary-violet focus:ring-1 focus:ring-primary-violet"
            />
          </div>
          
          {(role === 'admin' || (!isLogin)) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required={role === 'admin' || !isLogin}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary-violet focus:ring-1 focus:ring-primary-violet"
              />
            </div>
          )}

          {/* Dynamic Extra Fields based on role for Signup */}
          {!isLogin && role === 'doctor' && (
             <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Specialty</label>
                  <div className="flex flex-wrap gap-2">
                     {['Cardiology', 'ENT', 'Orthopedics', 'Neurology', 'Pediatrics', 'General'].map(spec => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => setSpecialty(spec)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all border ${
                            specialty === spec 
                              ? 'bg-primary-violet text-white border-primary-violet shadow-md' 
                              : 'bg-white text-gray-500 border-gray-200 hover:border-primary-violet hover:text-primary-violet'
                          }`}
                        >
                           {spec}
                        </button>
                     ))}
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none" />
               </div>
             </>
          )}

          {!isLogin && role === 'patient' && (
             <>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none" />
               </div>
               <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">3-Digit Privacy Code</label>
                    <input type="text" maxLength={3} minLength={3} value={privacyCode} onChange={(e) => setPrivacyCode(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none" />
                 </div>
                 <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood</label>
                    <input type="text" value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none" />
                 </div>
               </div>
             </>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary-violet hover:bg-primary-deep text-white font-medium py-2.5 rounded-xl transition-colors mt-2"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
