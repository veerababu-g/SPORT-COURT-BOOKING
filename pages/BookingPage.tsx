import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { Court, Booking } from '../types';
import { Clock, Info } from 'lucide-react';
import BookingModal from '../components/BookingModal';

const BookingPage: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    setCourts(storageService.getCourts());
    setBookings(storageService.getBookings());
    
    // Default select first court
    const allCourts = storageService.getCourts();
    if (allCourts.length > 0) setSelectedCourt(allCourts[0]);
  }, []);

  const refreshData = () => {
    setBookings(storageService.getBookings());
    setModalOpen(false);
    setSelectedSlot(null);
  };

  const isSlotBooked = (hour: number) => {
    if (!selectedCourt) return false;
    // Check if any booking on this date/court covers this hour
    return bookings.some(b => 
      b.status === 'confirmed' &&
      b.courtId === selectedCourt.id &&
      b.date === selectedDate &&
      (hour >= b.startTime && hour < b.endTime)
    );
  };

  const handleSlotClick = (hour: number) => {
    if (isSlotBooked(hour)) return;
    setSelectedSlot(hour);
    setModalOpen(true);
  };

  // Generate hours 8 AM to 10 PM
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Book a Court</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Date</label>
            <input 
              type="date" 
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Court</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {courts.map(court => (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourt(court)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                    selectedCourt?.id === court.id 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {court.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rules Info */}
      <div className="flex gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-400"></div>
          Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-300"></div>
          Booked
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>Peak hours (6 PM - 9 PM) are 1.5x price</span>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {hours.map(hour => {
          const booked = isSlotBooked(hour);
          const isPeak = hour >= 18 && hour < 21;
          const label = `${hour}:00 - ${hour + 1}:00`;
          
          return (
            <button
              key={hour}
              disabled={booked}
              onClick={() => handleSlotClick(hour)}
              className={`
                relative p-4 rounded-xl border transition-all text-left h-24 flex flex-col justify-between
                ${booked 
                  ? 'bg-rose-50 border-rose-100 opacity-70 cursor-not-allowed' 
                  : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer group'
                }
              `}
            >
              <div className="flex justify-between items-start w-full">
                <span className={`text-sm font-semibold ${booked ? 'text-rose-700' : 'text-slate-700'}`}>
                  {label}
                </span>
                {isPeak && !booked && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">PEAK</span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs">
                {booked ? (
                  <span className="text-rose-500 font-medium">Unavailable</span>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">Available</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && selectedCourt && selectedSlot !== null && (
        <BookingModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={refreshData}
          court={selectedCourt}
          date={selectedDate}
          startHour={selectedSlot}
          endHour={selectedSlot + 1}
        />
      )}
    </div>
  );
};

export default BookingPage;