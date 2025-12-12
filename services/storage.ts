import { Booking, BookingStatus, Coach, Court, CourtType, Equipment, PricingBreakdown, PricingRule } from '../types';

// Constants for LocalStorage Keys
const KEYS = {
  COURTS: 'cc_courts',
  COACHES: 'cc_coaches',
  EQUIPMENT: 'cc_equipment',
  BOOKINGS: 'cc_bookings',
  RULES: 'cc_rules',
  INIT: 'cc_initialized'
};

// Seed Data
const SEED_COURTS: Court[] = [
  { id: 'c1', name: 'Badminton A (Indoor)', type: CourtType.INDOOR, basePrice: 20 },
  { id: 'c2', name: 'Badminton B (Indoor)', type: CourtType.INDOOR, basePrice: 20 },
  { id: 'c3', name: 'Tennis 1 (Outdoor)', type: CourtType.OUTDOOR, basePrice: 15 },
  { id: 'c4', name: 'Tennis 2 (Outdoor)', type: CourtType.OUTDOOR, basePrice: 15 },
];

const SEED_COACHES: Coach[] = [
  { id: 'ch1', name: 'John Doe', specialty: 'Badminton', hourlyRate: 25 },
  { id: 'ch2', name: 'Sarah Smith', specialty: 'Tennis', hourlyRate: 30 },
];

const SEED_EQUIPMENT: Equipment[] = [
  { id: 'eq1', name: 'Racket', totalStock: 20, pricePerSession: 5 },
  { id: 'eq2', name: 'Shoes', totalStock: 10, pricePerSession: 3 },
];

const SEED_RULES: PricingRule[] = [
  { id: 'r1', name: 'Weekend Surcharge', type: 'WEEKEND', surcharge: 5, days: [0, 6] },
  { id: 'r2', name: 'Peak Hour', type: 'PEAK_HOUR', multiplier: 1.5, startTime: '18:00', endTime: '21:00' },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class StorageService {
  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!localStorage.getItem(KEYS.INIT)) {
      localStorage.setItem(KEYS.COURTS, JSON.stringify(SEED_COURTS));
      localStorage.setItem(KEYS.COACHES, JSON.stringify(SEED_COACHES));
      localStorage.setItem(KEYS.EQUIPMENT, JSON.stringify(SEED_EQUIPMENT));
      localStorage.setItem(KEYS.RULES, JSON.stringify(SEED_RULES));
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify([]));
      localStorage.setItem(KEYS.INIT, 'true');
    }
  }

  // --- Getters ---

  getCourts(): Court[] {
    return JSON.parse(localStorage.getItem(KEYS.COURTS) || '[]');
  }

  getCoaches(): Coach[] {
    return JSON.parse(localStorage.getItem(KEYS.COACHES) || '[]');
  }

  getEquipment(): Equipment[] {
    return JSON.parse(localStorage.getItem(KEYS.EQUIPMENT) || '[]');
  }

  getRules(): PricingRule[] {
    return JSON.parse(localStorage.getItem(KEYS.RULES) || '[]');
  }

  getBookings(): Booking[] {
    return JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
  }

  // --- Logic ---

  async checkAvailability(
    date: string, 
    startHour: number, 
    endHour: number, 
    courtId: string, 
    coachId?: string
  ): Promise<{ available: boolean; reason?: string }> {
    await delay(300); // Simulate network

    const bookings = this.getBookings();
    
    // 1. Check Court Overlap
    const courtConflict = bookings.find(b => 
      b.status === BookingStatus.CONFIRMED &&
      b.date === date &&
      b.courtId === courtId &&
      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      (startHour < b.endTime && endHour > b.startTime)
    );

    if (courtConflict) {
      return { available: false, reason: 'Court is already booked for this time slot.' };
    }

    // 2. Check Coach Availability
    if (coachId) {
      const coachConflict = bookings.find(b => 
        b.status === BookingStatus.CONFIRMED &&
        b.date === date &&
        b.resources.coachId === coachId &&
        (startHour < b.endTime && endHour > b.startTime)
      );

      if (coachConflict) {
        return { available: false, reason: 'Selected coach is unavailable at this time.' };
      }
    }

    return { available: true };
  }

  calculatePrice(court: Court, dateStr: string, startHour: number, endHour: number, resources: { rackets: number, shoes: number, coachId?: string }): PricingBreakdown {
    const rules = this.getRules();
    const equipment = this.getEquipment();
    const coaches = this.getCoaches();
    
    const date = new Date(dateStr);
    const day = date.getDay(); // 0-6
    const duration = endHour - startHour;

    let baseTotal = court.basePrice * duration;
    let weekendFee = 0;
    let peakHourFee = 0;
    
    // 1. Weekend Rule
    const weekendRule = rules.find(r => r.type === 'WEEKEND');
    if (weekendRule && weekendRule.days?.includes(day)) {
      weekendFee = (weekendRule.surcharge || 0) * duration;
    }

    // 2. Peak Hour Rule
    // Simple logic: if ANY part of the booking touches peak hour, apply multiplier to base
    const peakRule = rules.find(r => r.type === 'PEAK_HOUR');
    if (peakRule && peakRule.startTime && peakRule.endTime) {
      const peakStart = parseInt(peakRule.startTime.split(':')[0]);
      const peakEnd = parseInt(peakRule.endTime.split(':')[0]);
      
      // Check overlap with peak window
      if (startHour < peakEnd && endHour > peakStart) {
        // Calculate the raw cost difference
        const multiplier = peakRule.multiplier || 1;
        peakHourFee = (baseTotal * multiplier) - baseTotal; 
      }
    }

    // 3. Resources
    const racketPrice = equipment.find(e => e.name === 'Racket')?.pricePerSession || 0;
    const shoesPrice = equipment.find(e => e.name === 'Shoes')?.pricePerSession || 0;
    const equipmentFee = (resources.rackets * racketPrice) + (resources.shoes * shoesPrice);

    // 4. Coach
    let coachFee = 0;
    if (resources.coachId) {
      const coach = coaches.find(c => c.id === resources.coachId);
      if (coach) {
        coachFee = coach.hourlyRate * duration;
      }
    }

    return {
      basePrice: baseTotal,
      weekendFee,
      peakHourFee,
      equipmentFee,
      coachFee,
      total: baseTotal + weekendFee + peakHourFee + equipmentFee + coachFee
    };
  }

  async createBooking(bookingData: Omit<Booking, 'id' | 'status' | 'timestamp' | 'pricingBreakdown'>): Promise<Booking> {
    const check = await this.checkAvailability(
      bookingData.date, 
      bookingData.startTime, 
      bookingData.endTime, 
      bookingData.courtId, 
      bookingData.resources.coachId
    );

    if (!check.available) {
      throw new Error(check.reason);
    }

    const courts = this.getCourts();
    const targetCourt = courts.find(c => c.id === bookingData.courtId);
    if (!targetCourt) throw new Error("Court not found");

    const pricing = this.calculatePrice(
      targetCourt, 
      bookingData.date, 
      bookingData.startTime, 
      bookingData.endTime, 
      bookingData.resources
    );

    const newBooking: Booking = {
      ...bookingData,
      id: Math.random().toString(36).substr(2, 9),
      status: BookingStatus.CONFIRMED,
      timestamp: Date.now(),
      pricingBreakdown: pricing
    };

    const bookings = this.getBookings();
    bookings.push(newBooking);
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    
    return newBooking;
  }

  addEquipment(data: Omit<Equipment, 'id'>): Equipment {
    const list = this.getEquipment();
    const newUnite: Equipment = {
      ...data,
      id: 'eq_' + Math.random().toString(36).substr(2, 9)
    };
    list.push(newUnite);
    localStorage.setItem(KEYS.EQUIPMENT, JSON.stringify(list));
    return newUnite;
  }
}

export const storageService = new StorageService();