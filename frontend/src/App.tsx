import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useStore } from './store';
import { BedGrid } from './components/BedGrid';
import { OrganMap } from './components/OrganMap';
import { AIChat } from './components/AIChat';
import { Login } from './components/Login';
import { PrivacyCode } from './components/PrivacyCode';
import { 
  Bot, Search, LayoutDashboard, Bed as BedIcon, LogOut, 
  Calendar, Users, Settings, Plus, Mail, Bell, 
  ClipboardList, Stethoscope, BriefcaseMedical, CreditCard, ChevronDown, HelpCircle
} from 'lucide-react';

const queryClient = new QueryClient();
const socket = io('http://localhost:5000');

const AppointmentsModule = ({ activeUser }: { activeUser: any }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({ medication: '', dosage: '', instructions: '' });
  const [chatApt, setChatApt] = useState<any>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const endpoint = activeUser.role === 'PATIENT' ? '/api/appointments/patient-appointments' : '/api/appointments/doctor-appointments';
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        headers: { 'Authorization': `Bearer ${useStore.getState().token}` }
      });
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    
    // Listen for appointment updates
    if (activeUser.role === 'PATIENT') {
      socket.on(`appointment-status-patient-${activeUser.id}`, (updatedApt) => {
        setAppointments(prev => prev.map(a => a.id === updatedApt.id ? { ...a, status: updatedApt.status } : a));
        alert(`Your appointment status has been updated to ${updatedApt.status}!`);
      });
    } else {
      socket.on(`new-appointment-doctor-${activeUser.id}`, (newApt) => {
        setAppointments(prev => [newApt, ...prev]);
      });
    }

    return () => {
      socket.off(`appointment-status-patient-${activeUser.id}`);
      socket.off(`new-appointment-doctor-${activeUser.id}`);
    };
  }, [activeUser.id, activeUser.role]);

  useEffect(() => {
    if (chatApt) {
      fetch(`http://localhost:5000/api/appointments/${chatApt.id}/messages`, {
        headers: { 'Authorization': `Bearer ${useStore.getState().token}` }
      }).then(res => res.json()).then(data => setChatMessages(Array.isArray(data) ? data : []));

      socket.on(`new-message-appointment-${chatApt.id}`, (msg) => {
        setChatMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
      });
    } else {
      setChatMessages([]);
    }
    return () => {
      if (chatApt) socket.off(`new-message-appointment-${chatApt.id}`);
    };
  }, [chatApt]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    try {
      await fetch(`http://localhost:5000/api/appointments/${chatApt.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useStore.getState().token}` 
        },
        body: JSON.stringify({ content: chatMsg })
      });
      setChatMsg('');
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleStatusUpdate = async (aptId: number, status: string) => {
    try {
      await fetch(`http://localhost:5000/api/appointments/${aptId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useStore.getState().token}` 
        },
        body: JSON.stringify({ status })
      });
      fetchAppointments();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:5000/api/appointments/${selectedApt.id}/prescription`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useStore.getState().token}` 
        },
        body: JSON.stringify(prescriptionForm)
      });
      setShowPrescriptionModal(false);
      setPrescriptionForm({ medication: '', dosage: '', instructions: '' });
      fetchAppointments();
      alert('Prescription sent to patient!');
    } catch (err) {
      alert('Failed to send prescription');
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Loading appointments...</div>;

  return (
    <div className="p-10 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          {activeUser.role === 'PATIENT' ? 'My Appointments' : "Today's Appointments"}
        </h2>
        <div className="text-sm font-bold text-primary-violet bg-primary-violet/5 px-4 py-2 rounded-xl">
          {appointments.length} Scheduled
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-[40px] border border-dashed border-gray-200 text-center">
            <Calendar className="mx-auto text-gray-200 mb-4" size={48} />
            <div className="text-gray-400 font-bold">No appointments found.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((apt, i) => (
            <div key={i} className="bg-white p-5 rounded-[28px] border border-gray-100 flex items-center justify-between hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <img src={`https://i.pravatar.cc/80?u=${apt.id}`} className="w-14 h-14 rounded-2xl object-cover" />
                <div>
                  <div className="font-bold text-gray-900">
                    {activeUser.role === 'PATIENT' ? `Dr. ${apt.doctor?.name}` : apt.patient?.name}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    {apt.specialty} • {new Date(apt.date).toLocaleDateString()}
                  </div>
                  {apt.reason && <div className="text-[10px] text-gray-400 mt-1 italic">"{apt.reason}"</div>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <div className="font-black text-gray-800">{new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                    apt.status === 'ACCEPTED' ? 'text-green-500' : 
                    apt.status === 'PENDING' ? 'text-yellow-500' : 'text-gray-400'
                  }`}>
                    {apt.status}
                  </div>
                </div>

                {activeUser.role === 'DOCTOR' && apt.status === 'PENDING' && (
                  <button 
                    onClick={() => handleStatusUpdate(apt.id, 'ACCEPTED')}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 shadow-md"
                  >
                    Accept
                  </button>
                )}

                {activeUser.role === 'DOCTOR' && apt.status === 'ACCEPTED' && (
                  <button 
                    onClick={() => { setSelectedApt(apt); setShowPrescriptionModal(true); }}
                    className="bg-primary-violet text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-deep shadow-md flex items-center gap-2"
                  >
                    <ClipboardList size={14} /> Write Prescription
                  </button>
                )}

                {apt.status === 'ACCEPTED' && (
                  <button 
                    onClick={() => setChatApt(apt)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 shadow-md flex items-center gap-2"
                  >
                    <Mail size={14} /> Chat
                  </button>
                )}

                {apt.prescriptions && apt.prescriptions.length > 0 && (
                   <div className="bg-blue-50 text-blue-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                      Prescribed
                   </div>
                )}
              </div>
            </div>
          ))}        </div>
      )}

      {/* Chat Modal */}
      {chatApt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end p-4">
             <div className="bg-white rounded-l-[40px] rounded-r-[20px] w-full max-w-sm h-[90vh] p-8 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                 <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                       <img src={`https://i.pravatar.cc/100?u=${chatApt.id}`} className="w-12 h-12 rounded-full" />
                       <div>
                          <h3 className="font-black text-gray-900 leading-tight">
                             {activeUser.role === 'PATIENT' ? `Dr. ${chatApt.doctor?.name}` : chatApt.patient?.name}
                          </h3>
                          <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                             <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                          </p>
                       </div>
                    </div>
                    <button onClick={() => setChatApt(null)} className="text-gray-400 hover:text-red-500"><LogOut size={20} className="rotate-180" /></button>
                 </div>

                 <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2 space-y-4 flex flex-col">
                    <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest my-4">Appointment Approved</div>
                    
                    {chatMessages.map((m, i) => (
                       <div key={i} className={`p-4 rounded-3xl max-w-[85%] ${
                          m.senderRole === activeUser.role 
                          ? 'bg-primary-violet text-white rounded-tr-sm self-end' 
                          : 'bg-gray-100 text-gray-900 rounded-tl-sm self-start'
                       }`}>
                          <p className="text-sm font-medium">{m.content}</p>
                          <span className={`text-[10px] font-bold mt-2 block ${m.senderRole === activeUser.role ? 'text-white/50' : 'text-gray-400'}`}>
                             {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    ))}

                    {chatMessages.length === 0 && (
                       <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <Mail className="mx-auto text-gray-300 mb-2" size={24} />
                          <p className="text-xs text-gray-400 font-bold">Start the conversation...</p>
                       </div>
                    )}
                 </div>

                 <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                       value={chatMsg}
                       onChange={e => setChatMsg(e.target.value)}
                       placeholder="Type your message..."
                       className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-0"
                    />
                    <button type="submit" className="bg-black text-white p-3 rounded-2xl hover:scale-105 transition-transform"><Mail size={18} /></button>
                 </form>
             </div>
        </div>
      )}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-black mb-6 text-gray-900">Write Prescription</h3>
                <form onSubmit={handlePrescriptionSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Medication</label>
                        <input 
                           required
                           className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold"
                           value={prescriptionForm.medication}
                           onChange={e => setPrescriptionForm({...prescriptionForm, medication: e.target.value})}
                           placeholder="e.g. Paracetamol"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Dosage</label>
                        <input 
                           required
                           className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold"
                           value={prescriptionForm.dosage}
                           onChange={e => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})}
                           placeholder="e.g. 500mg, twice daily"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Instructions</label>
                        <textarea 
                           className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold min-h-[100px]"
                           value={prescriptionForm.instructions}
                           onChange={e => setPrescriptionForm({...prescriptionForm, instructions: e.target.value})}
                           placeholder="e.g. After meals"
                        />
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button type="submit" className="flex-1 bg-primary-violet text-white font-black py-4 rounded-2xl shadow-lg hover:bg-primary-deep transition-all">Send Prescription</button>
                        <button type="button" onClick={() => setShowPrescriptionModal(false)} className="px-8 bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

const PatientsModule = () => (
   <div className="p-10 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Patient Directory</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {[
            { name: "Liam Wilson", age: 42, condition: "Stable", blood: "O+", img: "15" },
            { name: "Olivia Brown", age: 29, condition: "Recovering", blood: "A-", img: "21" },
            { name: "Noah Garcia", age: 56, condition: "Critical", blood: "B+", img: "33" },
            { name: "Emma Jones", age: 34, condition: "Stable", blood: "AB+", img: "45" },
            { name: "Lucas Miller", age: 61, condition: "Stable", blood: "O-", img: "52" },
         ].map((u, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-all">
               <img src={`https://i.pravatar.cc/100?u=${u.img}`} className="w-20 h-20 rounded-3xl mb-4 border-2 border-white shadow-sm" />
               <div className="font-black text-gray-900">{u.name}</div>
               <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{u.age} years • {u.blood}</div>
               <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${u.condition === 'Critical' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                  {u.condition}
               </div>
            </div>
         ))}
      </div>
   </div>
);

const DoctorsModule = ({ activeUser }: { activeUser: any }) => {
  const [specialties, setSpecialties] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({ date: '', reason: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDoctors = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/appointments/doctors-by-specialty', {
        headers: { 'Authorization': `Bearer ${useStore.getState().token}` }
      });
      const data = await res.json();
      setSpecialties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/appointments/book', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useStore.getState().token}` 
        },
        body: JSON.stringify({
          doctorId: bookingDoctor.id,
          specialty: bookingDoctor.specialty,
          date: bookingForm.date,
          reason: bookingForm.reason
        })
      });
      if (!res.ok) throw new Error('Booking failed');
      alert('Appointment booked successfully! Wait for doctor approval.');
      setBookingDoctor(null);
      setBookingForm({ date: '', reason: '' });
    } catch (err) {
      alert('Failed to book appointment');
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Loading specialist directory...</div>;

  return (
    <div className="p-10 flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
         <h2 className="text-4xl font-black text-gray-900 tracking-tight">Medical Specialist Directory</h2>
         <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
               type="text" 
               placeholder="Search by doctor name..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-violet/20"
            />
         </div>
      </div>
      
      {Object.entries(specialties).map(([spec, doctors]) => {
        // Filter out fake doctors if user wants to see their actual typed name
        const filteredDocs = doctors.filter(d => 
           d.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredDocs.length === 0) return null;

        return (
         <div key={spec} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
               <h3 className="text-xl font-black text-gray-900">{spec} Department</h3>
               <div className="h-px bg-gray-100 flex-1"></div>
               <span className="text-xs font-bold text-gray-400">{filteredDocs.length} Doctors</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {filteredDocs.map((doc, i) => (
                  <div key={doc.id} className="bg-white p-8 rounded-[40px] border border-gray-100 flex items-center gap-8 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                   <div className="relative">
                      <img src={`https://i.pravatar.cc/120?u=${doc.id}`} className="w-24 h-24 rounded-[32px] object-cover shadow-md" />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-2xl border-4 border-white"></div>
                   </div>
                   <div className="flex-1">
                      <div className="font-black text-gray-900 text-xl">Dr. {doc.name}</div>
                      <div className="text-sm text-primary-violet font-bold mb-1">{doc.hospital?.name || 'MediBed Hospital'}</div>
                      <div className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full w-fit">Availability: Mon-Fri</div>
                   </div>
                   {activeUser.role === 'PATIENT' && (
                     <button 
                        onClick={() => setBookingDoctor(doc)}
                        className="bg-black text-white font-black px-6 py-3 rounded-2xl text-xs hover:scale-105 transition-all shadow-lg"
                      >
                        Book Now
                      </button>
                   )}
                </div>
              ))}
           </div>
        </div>
      );
      })}

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-8">
                   <img src={`https://i.pravatar.cc/100?u=${bookingDoctor.id}`} className="w-16 h-16 rounded-2xl" />
                   <div>
                      <h3 className="text-2xl font-black text-gray-900">Dr. {bookingDoctor.name}</h3>
                      <p className="text-sm text-primary-violet font-bold">{bookingDoctor.specialty} Specialist</p>
                   </div>
                </div>
                <form onSubmit={handleBooking} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Preferred Date & Time</label>
                        <input 
                           required type="datetime-local" 
                           className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold"
                           value={bookingForm.date}
                           onChange={e => setBookingForm({...bookingForm, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Chief Complaint / Reason</label>
                        <textarea 
                           className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold min-h-[100px]"
                           value={bookingForm.reason}
                           onChange={e => setBookingForm({...bookingForm, reason: e.target.value})}
                           placeholder="Describe your symptoms briefly..."
                        />
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button type="submit" className="flex-1 bg-black text-white font-black py-4 rounded-2xl shadow-lg hover:bg-gray-800 transition-all">Confirm Booking</button>
                        <button type="button" onClick={() => setBookingDoctor(null)} className="px-8 bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

const InventoryModule = () => (
   <div className="p-10 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Supplies & Inventory</h2>
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
               </tr>
            </thead>
            <tbody>
               {[
                  { name: "Surgical Masks", cat: "Protective", stock: "1,200", status: "In Stock" },
                  { name: "Hospital Beds", cat: "Equipment", stock: "45", status: "Critical" },
                  { name: "Hand Sanitizer", cat: "Hygiene", stock: "800", status: "In Stock" },
                  { name: "Latex Gloves", cat: "Protective", stock: "2,500", status: "In Stock" },
               ].map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                     <td className="px-8 py-6 font-bold text-gray-900">{item.name}</td>
                     <td className="px-8 py-6 text-sm text-gray-500 font-medium">{item.cat}</td>
                     <td className="px-8 py-6 font-black text-gray-800">{item.stock}</td>
                     <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.status === 'Critical' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>{item.status}</span>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   </div>
);

const HelpModule = () => (
   <div className="p-10 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Help Center</h2>
      <div className="flex flex-col gap-4">
         {[
            { q: "How do I book a new appointment?", a: "Go to the Appointments module and click the 'Add New' button at the top right." },
            { q: "Where can I find my privacy code?", a: "Your 3-digit privacy code is displayed at the bottom of your Health History card on the main dashboard." },
            { q: "How to contact my assigned doctor?", a: "Visit the Doctors module, find your doctor's profile, and click 'Contact' for secure messaging." },
         ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
               <div className="font-bold text-lg text-gray-900 mb-2">{item.q}</div>
               <div className="text-sm text-gray-500 leading-relaxed font-medium">{item.a}</div>
            </div>
         ))}
      </div>
   </div>
);

const SettingsModule = () => (
   <div className="p-10 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <h2 className="text-3xl font-black text-gray-900 tracking-tight">General Settings</h2>
      <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm flex flex-col gap-10">
         <section>
            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[2px] mb-6">Profile Settings</h4>
            <div className="flex items-center gap-6">
               <img src="https://i.pravatar.cc/150?u=active" className="w-24 h-24 rounded-[32px] border-4 border-gray-50 shadow-sm" />
               <button className="bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md hover:scale-105 transition-all">Change Photo</button>
               <button className="text-red-500 font-bold px-4 py-3 rounded-2xl text-sm hover:bg-red-50 transition-all">Remove</button>
            </div>
         </section>
         <section className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
               <input type="text" value="Rishabh Singh" readOnly className="bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-0" />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role</label>
               <input type="text" value="Premium Patient" readOnly className="bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-0" />
            </div>
         </section>
         <section className="flex gap-4">
             <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold flex-1">Save All Changes</button>
             <button className="bg-gray-50 text-gray-400 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 hover:text-gray-900">Cancel</button>
         </section>
      </div>
   </div>
);

const PatientDashboard = ({ user }: { user: any }) => {
   const [latestApt, setLatestApt] = useState<any>(null);

   useEffect(() => {
      const fetchLatest = async () => {
         try {
            const res = await fetch('http://localhost:5000/api/appointments/patient-appointments', {
               headers: { 'Authorization': `Bearer ${useStore.getState().token}` }
            });
            const data = await res.json();
            if (data && data.length > 0) setLatestApt(data[0]);
         } catch (e) {}
      };
      fetchLatest();

      socket.on(`appointment-status-patient-${user.id}`, (apt) => {
         setLatestApt(apt);
      });
      return () => { socket.off(`appointment-status-patient-${user.id}`); };
   }, [user.id]);

   return (
      <div className="flex-1 flex flex-col gap-6 p-8 custom-scrollbar">
         {/* Top Summary Tiles */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat-card bg-[#E0E7FF]/50 border border-[#C7D2FE]">
               <div className="bg-white p-2 rounded-xl w-fit shadow-sm mb-4"><Users className="text-[#6366F1]" size={20} /></div>
               <div className="text-sm font-medium text-gray-500">Total Consultations</div>
               <div className="text-2xl font-bold text-gray-900 mt-1">12 <span className="text-xs text-green-500">+2.1%</span></div>
               <div className="text-[11px] text-gray-400 mt-1">2 more than last month</div>
            </div>
            <div className="stat-card bg-[#F0FDF4]/50 border border-[#DCFCE7]">
               <div className="bg-white p-2 rounded-xl w-fit shadow-sm mb-4"><Calendar className="text-[#22C55E]" size={20} /></div>
               <div className="text-sm font-medium text-gray-500">Upcoming Appointments</div>
               <div className="text-2xl font-bold text-gray-900 mt-1">{latestApt ? '1' : '0'} <span className="text-xs text-red-500">-1.5%</span></div>
               <div className="text-[11px] text-gray-400 mt-1">Next: {latestApt ? new Date(latestApt.date).toLocaleDateString() : 'None'}</div>
            </div>
            {/* Notification Tile */}
            <div className={`stat-card ${latestApt?.status === 'ACCEPTED' ? 'bg-green-100 border-green-200 animate-pulse' : 'bg-[#FEFCE8]/50 border-[#FEF9C3]'}`}>
               <div className="bg-white p-2 rounded-xl w-fit shadow-sm mb-4"><Bell className={latestApt?.status === 'ACCEPTED' ? 'text-green-600' : 'text-[#EAB308]'} size={20} /></div>
               <div className="text-sm font-medium text-gray-500">Last Notification</div>
               <div className="text-lg font-bold text-gray-900 mt-1">
                  {latestApt ? `Apt ${latestApt.status}` : 'No new updates'}
               </div>
               <div className="text-[11px] text-gray-400 mt-1">{latestApt ? `For ${latestApt.specialty}` : 'Check back later'}</div>
            </div>
            <div className="stat-card bg-[#F3E8FF]/50 border border-[#E9D5FF]">
               <div className="bg-white p-2 rounded-xl w-fit shadow-sm mb-4"><CreditCard className="text-[#A855F7]" size={20} /></div>
               <div className="text-sm font-medium text-gray-500">Total Invoices</div>
               <div className="text-2xl font-bold text-gray-900 mt-1">₹ 24,500 <span className="text-xs text-green-500">+3.4%</span></div>
               <div className="text-[11px] text-gray-400 mt-1">All dues cleared</div>
            </div>
         </div>

         {/* Middle Section: Health & Appointments */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Patient Health Module (Organ) */}
            <div className="lg:col-span-12 bg-white rounded-[32px] p-8 shadow-card border border-gray-100 relative overflow-hidden flex flex-col">
               <div className="flex items-center justify-between mb-8 z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981]"><Stethoscope size={20} /></div>
                     <div>
                        <h3 className="font-semibold text-gray-900">Current Treatment Plan</h3>
                        <p className="text-xs text-gray-400">Personalized Care</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex-1 flex items-center justify-center animate-float relative min-h-[300px]">
                    <OrganMap />
                  </div>
                  <div className="flex flex-col gap-4 justify-center">
                    {latestApt?.status === 'ACCEPTED' && (
                       <div className="bg-green-50 p-6 rounded-[32px] border border-green-100">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white"><Plus size={16} /></div>
                             <span className="font-black text-green-700">Appointment Accepted!</span>
                          </div>
                          <p className="text-sm text-green-600 mb-4">Dr. {latestApt.doctor?.name} has approved your request for {new Date(latestApt.date).toLocaleString()}.</p>
                          <button className="bg-green-600 text-white font-bold px-6 py-2 rounded-xl text-xs">View Pre-care Instructions</button>
                       </div>
                    )}
                    
                    {latestApt?.prescriptions && latestApt.prescriptions.length > 0 && (
                       <div className="bg-primary-violet/5 p-6 rounded-[32px] border border-primary-violet/10">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-primary-violet flex items-center justify-center text-white"><ClipboardList size={16} /></div>
                             <span className="font-black text-primary-violet">New Prescription Received</span>
                          </div>
                          {latestApt.prescriptions.map((p: any, i: number) => (
                             <div key={i} className="mb-2 last:mb-0">
                                <div className="font-bold text-gray-900 text-sm">{p.medication} - {p.dosage}</div>
                                <div className="text-xs text-gray-500 italic">"{p.instructions}"</div>
                             </div>
                          ))}
                       </div>
                    )}

                    {!latestApt && (
                        <div className="p-8 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                           <Calendar className="mx-auto text-gray-300 mb-4" size={32} />
                           <p className="text-gray-400 font-bold">No Recent Activity</p>
                           <p className="text-xs text-gray-400 mt-1">Book a specialist from the Doctors menu to get started.</p>
                        </div>
                    )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

const BedManagement = ({ beds = [] }: { beds: any[] }) => {
   const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
   
   // Safety check for beds being an array
   const safeBeds = Array.isArray(beds) ? beds : [];

   // Grouping beds by floor (mocking floors if not in data)
   const floorGroups = safeBeds.reduce((acc: any, bed) => {
      if (!bed) return acc;
      const floor = bed.floor || (bed.id % 3) + 1; // Mocking 3 floors
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(bed);
      return acc;
   }, {});

   // Summary stats by specialty
   const stats = {
      icu: { total: 67, available: 23, price: 600, percent: 62 },
      general: { total: 66, available: 16, price: 180, percent: 58 },
      semi: { total: 42, available: 6, price: 180, percent: 21 },
      emergency: { total: 35, available: 4, price: 800, percent: 90 },
   };

   const filteredBeds = (bedsList: any[]) => (bedsList || []).filter(b => {
      if (!b) return false;
      if (filter === 'all') return true;
      if (filter === 'available') return b.status === 'AVAILABLE';
      if (filter === 'occupied') return b.status === 'OCCUPIED';
      if (filter === 'maintenance') return b.status === 'MAINTENANCE';
      return true;
   });

   return (
      <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar h-full">
         <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Hospital Bed Management</h2>
            <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold shadow-sm"><Plus size={16} /> Add Bed</button>
               <button className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg">Set Vacancy</button>
            </div>
         </div>

         {/* Summary Row */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary-violet transition-all">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-violet group-hover:text-white transition-colors"><BedIcon size={18} /></div>
                     <span className="text-2xl font-black text-gray-900">210</span>
                  </div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Beds</div>
               </div>
               <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-primary-violet rotate-45"></div>
            </div>
            {[
               { id: 'icu', label: 'ICU Beds', color: 'bg-purple-500', ...stats.icu },
               { id: 'general', label: 'General +', color: 'bg-blue-500', ...stats.general },
               { id: 'semi', label: 'Semi-Private', color: 'bg-pink-500', ...stats.semi },
               { id: 'emergency', label: 'Emergency', color: 'bg-orange-500', ...stats.emergency },
            ].map((s) => (
               <div key={s.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                        <span className="text-2xl font-black text-gray-900">{s.total}</span>
                     </div>
                     <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</div>
                     <div className="text-[10px] font-bold text-green-500 mt-2">+{s.available} available</div>
                  </div>
                  <div className="relative flex items-center justify-center">
                     <span className="absolute text-[10px] font-black">{s.percent}%</span>
                     <svg className="w-14 h-14 -rotate-90">
                        <circle cx="28" cy="28" r="22" className="stroke-gray-50 fill-none" strokeWidth="4" />
                        <circle cx="28" cy="28" r="22" className="stroke-current fill-none transition-all duration-1000" strokeWidth="4" strokeDasharray={`${s.percent * 1.38} 1000`} style={{ color: s.color.replace('bg-', '') }} />
                     </svg>
                  </div>
               </div>
            ))}
         </div>

         {/* Filters */}
         <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
               {['all', 'available', 'occupied', 'maintenance'].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                     {f} Beds
                  </button>
               ))}
            </div>
            <div className="flex items-center gap-3">
               <div className="text-xs font-black text-gray-400">Sort By: <span className="text-gray-900">Bed Status</span></div>
               <button className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"><LayoutDashboard size={18} /></button>
            </div>
         </div>

         {/* Floor-wise Beds */}
         <div className="flex flex-col gap-10">
            {Object.entries(floorGroups).map(([floor, floorBeds]: [string, any]) => (
               <div key={floor} className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                     <div className="h-px bg-gray-100 flex-1"></div>
                     <h3 className="text-sm font-black text-gray-300 uppercase tracking-[4px]">Floor 0{floor}</h3>
                     <div className="h-px bg-gray-100 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                     {filteredBeds(floorBeds).map((bed: any) => (
                        <div key={bed.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden group">
                           {/* Status Indicator */}
                           <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${bed?.status === 'AVAILABLE' ? 'bg-green-500' : bed?.status === 'OCCUPIED' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                           
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{bed?.ward?.type || 'GENERAL'}</span>
                              <h4 className="text-lg font-black text-gray-900">{bed?.ward?.type?.substring(0,3).toUpperCase() || 'GEN'}-{(bed?.number || bed?.bedNumber || bed?.id).toString().padStart(3, '0')}</h4>
                              <span className="text-xs font-bold text-gray-400 mt-1">₹ {bed?.price || 180}/day</span>
                           </div>

                           <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl">
                              <img src={`https://i.pravatar.cc/100?u=${bed?.id}`} className="w-10 h-10 rounded-xl" />
                              <div className="flex flex-col min-w-0">
                                 <span className="text-xs font-black text-gray-900 truncate">{bed?.status === 'AVAILABLE' ? 'No Patient' : 'Philip Berlin'}</span>
                                 <span className="text-[10px] font-bold text-gray-400">ID: {(bed?.id || 0) + 1000}</span>
                              </div>
                           </div>

                           <div className="flex items-center justify-between mt-2">
                              <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${bed?.status === 'AVAILABLE' ? 'text-green-500' : 'text-blue-500'}`}>
                                 <div className={`w-1.5 h-1.5 rounded-full ${bed?.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                 {bed?.status || 'N/A'}
                              </div>
                              <div className="w-8 h-4 bg-gray-100 rounded-full relative p-0.5">
                                 <div className={`w-3 h-3 rounded-full transition-all ${bed?.status === 'AVAILABLE' ? 'bg-black ml-0' : 'bg-blue-500 ml-4'}`}></div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>

         {/* Bottom Analytics Row */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
               <h4 className="text-lg font-black text-gray-900 mb-6">Bed Occupancy</h4>
               <div className="flex items-center justify-center h-48 relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-3xl font-black text-gray-900">55%</span>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Occupied</span>
                  </div>
                  <svg className="w-40 h-40">
                     <circle cx="80" cy="80" r="70" className="stroke-gray-50 fill-none" strokeWidth="12" />
                     <circle cx="80" cy="80" r="70" className="stroke-primary-violet fill-none" strokeWidth="12" strokeDasharray="240 1000" strokeLinecap="round" />
                  </svg>
               </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm lg:col-span-2">
               <h4 className="text-lg font-black text-gray-900 mb-6">Maintenance Analytics</h4>
               <div className="h-48 flex items-end justify-between gap-4 px-4">
                  {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                     <div key={i} className="flex-1 bg-gray-50 rounded-t-xl relative group">
                        <div className="absolute bottom-0 w-full bg-primary-violet rounded-t-xl transition-all duration-1000" style={{ height: `${h}%` }}></div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded hidden group-hover:block">{h}%</div>
                     </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[10px] font-black text-gray-300 uppercase px-4">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span><span>Now</span>
               </div>
            </div>
         </div>
      </div>
   );
};

function Dashboard() {
  const { patchBedStatus, setBeds, activeUser, setToken, setActiveUser } = useStore();
  const hospitalId = activeUser?.hospitalId || 1;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'beds' | 'ai' | 'appointments' | 'patients' | 'doctors' | 'inventory' | 'help' | 'settings'>('dashboard');

  const { data: bedsData } = useQuery({
    queryKey: ['beds', hospitalId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/beds/hospital/${hospitalId}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!activeUser
  });

  useEffect(() => {
    if (bedsData?.beds) {
      setBeds(bedsData.beds);
    }
  }, [bedsData, setBeds]);

  useEffect(() => {
    socket.emit('join-hospital', hospitalId.toString());
    socket.on('bed:status-changed', (data: { bedId: number; status: any }) => {
      patchBedStatus(data.bedId, data.status);
    });
    return () => {
      socket.off('bed:status-changed');
    };
  }, [hospitalId, patchBedStatus]);

  const handleLogout = () => {
    setToken('');
    setActiveUser(null);
  };

  const isPatient = activeUser?.role === 'PATIENT' || activeUser?.role === 'patient';

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden font-sans">
      {/* HavenMed Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col py-8 px-6">
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
             <Bot size={22} className="text-yellow-400" />
          </div>
          <span className="font-display font-black text-2xl text-gray-900 tracking-tight">MediBed</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-8">
           <section>
              <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[2px] mb-4 ml-2">Main Menu</h4>
              <nav className="flex flex-col gap-1">
                 <button onClick={() => setActiveTab('dashboard')} className={`sidebar-item flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                    <div className="flex items-center gap-3"><LayoutDashboard size={20} /><span className="text-sm font-bold">Dashboard</span></div>
                 </button>
                 <button onClick={() => setActiveTab('appointments')} className={`sidebar-item flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'appointments' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                    <Calendar size={20} /><span className="text-sm font-bold">Appointments</span>
                 </button>
                 <button onClick={() => setActiveTab('patients')} className={`sidebar-item flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'patients' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                    <Users size={20} /><span className="text-sm font-bold">Patients</span>
                 </button>
              </nav>
           </section>

           <section>
              <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[2px] mb-4 ml-2">Care Menu</h4>
              <nav className="flex flex-col gap-1">
                 <button onClick={() => setActiveTab('doctors')} className={`sidebar-item flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'doctors' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                    <div className="flex items-center gap-3"><Stethoscope size={20} /><span className="text-sm font-bold">Doctors</span></div>
                    <ChevronDown size={14} className="opacity-40" />
                 </button>
                 {!isPatient && (
                    <button onClick={() => setActiveTab('beds')} className={`sidebar-item flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'beds' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                       <BedIcon size={20} /><span className="text-sm font-bold">Bed Room</span>
                    </button>
                 )}
                 <button onClick={() => setActiveTab('ai')} className={`sidebar-item flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'ai' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                    <Bot size={20} /><span className="text-sm font-bold">AI Counselor</span>
                 </button>
                 <button onClick={() => setActiveTab('inventory')} className={`sidebar-item flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'inventory' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                    <BriefcaseMedical size={20} /><span className="text-sm font-bold">Inventory</span>
                 </button>
              </nav>
           </section>

           <section>
              <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[2px] mb-4 ml-2">Help</h4>
              <nav className="flex flex-col gap-1">
                 <button onClick={() => setActiveTab('help')} className={`sidebar-item flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'help' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                    <HelpCircle size={20} /><span className="text-sm font-bold">Help Center</span>
                 </button>
                 <button onClick={() => setActiveTab('settings')} className={`sidebar-item flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'settings' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                    <Settings size={20} /><span className="text-sm font-bold">Settings</span>
                 </button>
              </nav>
           </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col gap-2">
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold group"
            >
               <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <LogOut size={20} />
               </div>
               <span className="text-sm">Sign Out</span>
            </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full bg-bg-main overflow-hidden">
        {/* MediBed Topbar */}
        <header className="h-24 min-h-[96px] bg-white border-b border-gray-50 flex items-center justify-between px-10 shrink-0">
           <div className="relative w-96 max-w-sm">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search everything here..." 
                className="w-full pl-14 pr-6 py-4 rounded-[20px] bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
              />
           </div>

           <div className="flex items-center gap-4">
              <button className="bg-black text-white px-6 py-3.5 rounded-[20px] text-sm font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                 <Plus size={18} /><span>Add New</span><ChevronDown size={14} className="opacity-60 ml-1" />
              </button>
              
              <div className="flex items-center gap-2 mx-4 border-r border-gray-100 pr-6">
                 <button className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors relative">
                    <Mail size={20} />
                    <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                 </button>
                 <button className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <Bell size={20} />
                 </button>
                 <button className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors" onClick={() => setActiveTab('settings')}>
                    <Settings size={20} />
                 </button>
              </div>

              <div className="flex items-center gap-3 pl-2 cursor-pointer group" onClick={handleLogout} title="Click to Logout">
                 <div className="text-right hidden sm:block">
                    <div className="text-sm font-black text-gray-900 leading-tight group-hover:text-red-500 transition-colors">{activeUser?.name || 'Jack Chain'}</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-red-400 transition-colors">{activeUser?.role || 'Patient'}</div>
                 </div>
                 <img 
                   src={`https://i.pravatar.cc/100?u=${activeUser?.id || 1}`} 
                   className="w-14 h-14 rounded-2xl bg-gray-50 shadow-sm object-cover border-2 border-white group-hover:border-red-500 transition-all" 
                 />
              </div>
           </div>
        </header>

        {/* Dynamic Screen Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
           {activeTab === 'dashboard' && (
              isPatient ? <PatientDashboard user={activeUser} /> : (
                 <div className="p-10 flex flex-col gap-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
                       <div className="lg:col-span-8 flex flex-col gap-8">
                          <div className="bg-white rounded-[40px] shadow-card p-10 h-[500px] border border-gray-100 flex flex-col">
                             <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black tracking-tight text-gray-900">Bed Control Panel</h2>
                                <div className="text-xs font-black px-4 py-2 bg-gray-50 rounded-xl text-gray-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Hospital Active
                                </div>
                             </div>
                             <div className="flex-1 overflow-hidden">
                                <BedGrid />
                             </div>
                          </div>
                          <PrivacyCode />
                       </div>
                       
                       <div className="lg:col-span-4 flex flex-col">
                          <div className="bg-white rounded-[40px] shadow-card border border-gray-100 p-8 flex flex-col mb-8 flex-1 min-h-[400px]">
                              <h2 className="text-xl font-bold mb-6 text-gray-900">Patient Status Map</h2>
                              <div className="flex-1 w-full bg-[#F4F7FE] rounded-[32px] flex items-center justify-center relative overflow-hidden py-10">
                                 <OrganMap />
                              </div>
                          </div>
                       </div>
                    </div>
                 </div>
              )
           )}

           {activeTab === 'beds' && (
              <BedManagement beds={Object.values(useStore.getState().bedsCache)} />
           )}

           {activeTab === 'ai' && (
              <div className="p-10 h-full flex flex-col items-center">
                 <div className="h-full w-full max-w-5xl bg-white rounded-[40px] shadow-card border border-gray-100 overflow-hidden flex flex-col">
                    <AIChat />
                 </div>
              </div>
           )}

           {activeTab === 'appointments' && <AppointmentsModule activeUser={activeUser} />}
           {activeTab === 'patients' && <PatientsModule />}
           {activeTab === 'doctors' && <DoctorsModule activeUser={activeUser} />}
           {activeTab === 'inventory' && <InventoryModule />}
           {activeTab === 'help' && <HelpModule />}
           {activeTab === 'settings' && <SettingsModule />}
        </div>
      </main>
    </div>
  );
}

function MainApp() {
  const token = useStore(state => state.token);
  return token ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}

export default App;
