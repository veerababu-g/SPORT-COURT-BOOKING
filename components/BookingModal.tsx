import React, { useEffect, useState } from 'react';
import { X, Check, Loader2, Info } from 'lucide-react';
import { Court, Coach, Equipment, PricingBreakdown } from '../types';
import { storageService } from '../services/storage';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court;
  date: string;
  startHour: number;
  endHour: number;
  onConfirm: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, court, date, startHour, endHour, onConfirm }) => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string | undefined>(undefined);
  const [racketCount, setRacketCount] = useState(0);
  const [shoeCount, setShoeCount] = useState(0);
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCoaches(storageService.getCoaches());
      setEquipment(storageService.getEquipment());
      updatePricing();
    }
  }, [isOpen, selectedCoachId, racketCount, shoeCount]);

  const updatePricing = () => {
    const price = storageService.calculatePrice(
      court, 
      date, 
      startHour, 
      endHour, 
      {
        rackets: racketCount,
        shoes: shoeCount,
        coachId: selectedCoachId
      }
    );
    setPricing(price);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await storageService.createBooking({
        userId: 'user_current', // Mock user
        courtId: court.id,
        date,
        startTime: startHour,
        endTime: endHour,
        resources: {
          rackets: racketCount,
          shoes: shoeCount,
          coachId: selectedCoachId
        }
      });
      onConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Complete Booking</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Summary */}
          <div className="bg-indigo-50 p-4 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-900">
              <p><span className="font-semibold">Court:</span> {court.name}</p>
              <p><span className="font-semibold">Date:</span> {date}</p>
              <p><span className="font-semibold">Time:</span> {startHour}:00 - {endHour}:00</p>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Add-ons</h3>
            <div className="space-y-4">
              
              {/* Equipment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rackets ($5/ea)</label>
                  <select 
                    value={racketCount}
                    onChange={(e) => setRacketCount(Number(e.target.value))}
                    className="w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="border border-slate-200 rounded-lg p-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shoes ($3/pair)</label>
                  <select 
                    value={shoeCount}
                    onChange={(e) => setShoeCount(Number(e.target.value))}
                    className="w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Coach */}
              <div className="border border-slate-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Coach (Optional)</label>
                <select 
                  value={selectedCoachId || ''}
                  onChange={(e) => setSelectedCoachId(e.target.value || undefined)}
                  className="w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">No Coach</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.specialty} (+${c.hourlyRate}/hr)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          {pricing && (
            <div className="border-t border-slate-100 pt-4">
               <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Price Breakdown</h3>
               <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Price</span>
                    <span>${pricing.basePrice.toFixed(2)}</span>
                  </div>
                  {pricing.weekendFee > 0 && (
                     <div className="flex justify-between text-amber-600">
                       <span>Weekend Surcharge</span>
                       <span>+${pricing.weekendFee.toFixed(2)}</span>
                     </div>
                  )}
                  {pricing.peakHourFee > 0 && (
                     <div className="flex justify-between text-rose-600">
                       <span>Peak Hour Fee</span>
                       <span>+${pricing.peakHourFee.toFixed(2)}</span>
                     </div>
                  )}
                   <div className="flex justify-between">
                    <span>Equipment</span>
                    <span>${pricing.equipmentFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coach</span>
                    <span>${pricing.coachFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-slate-900 border-t border-slate-200 pt-2 mt-2">
                    <span>Total</span>
                    <span>${pricing.total.toFixed(2)}</span>
                  </div>
               </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white hover:border-slate-400 transition-all font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;