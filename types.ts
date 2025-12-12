export enum CourtType {
  INDOOR = 'Indoor',
  OUTDOOR = 'Outdoor'
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  WAITLIST = 'waitlist'
}

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  basePrice: number;
}

export interface Coach {
  id: string;
  name: string;
  specialty: string;
  hourlyRate: number;
}

export interface Equipment {
  id: string;
  name: string;
  totalStock: number;
  pricePerSession: number;
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'WEEKEND' | 'PEAK_HOUR';
  multiplier?: number;
  surcharge?: number;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  days?: number[];    // 0=Sun, 6=Sat
}

export interface PricingBreakdown {
  basePrice: number;
  peakHourFee: number;
  weekendFee: number;
  equipmentFee: number;
  coachFee: number;
  total: number;
}

export interface Booking {
  id: string;
  userId: string; // Simulated
  courtId: string;
  date: string; // ISO Date String YYYY-MM-DD
  startTime: number; // Hour 0-23
  endTime: number; // Hour 0-23
  resources: {
    rackets: number;
    shoes: number;
    coachId?: string;
  };
  status: BookingStatus;
  pricingBreakdown: PricingBreakdown;
  timestamp: number;
}