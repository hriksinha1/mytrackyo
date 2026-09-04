import { IRepository, Property, Customer, Booking, Payment, Notification, BusinessSettings } from './types';
import { generateId } from '../utils/formatters';

const STORAGE_KEY = 'hotel_manager_demo_db';

interface DemoDB {
  properties: Property[];
  customers: Customer[];
  bookings: Booking[];
  payments: Payment[];
  notifications: Notification[];
  settings: BusinessSettings;
}

const seedData: DemoDB = {
  settings: {
    name: 'Serene Hospitality Group',
    legalName: 'Serene Hospitality Pvt. Ltd.',
    gstin: '29ABCDE1234F1Z5'
  },
  properties: [
    {
      id: 'p1', name: 'The Heritage Courtyard', property_type: 'Hotel', location: 'City Center',
      address: '12 Temple Road', city: 'Mysuru', state: 'Karnataka', pincode: '570001',
      phone: '9876543210', email: 'heritage@serene.local', gstin: '29ABCDE1234F1Z5',
      check_in_time: '14:00', check_out_time: '11:00', active: true, created_at: new Date().toISOString()
    },
    {
      id: 'p2', name: 'Valley View Resort', property_type: 'Resort', location: 'Hill Station',
      address: 'Mist Point', city: 'Munnar', state: 'Kerala', pincode: '685612',
      phone: '9876543211', email: 'valley@serene.local', gstin: '32ABCDE1234F1Z5',
      check_in_time: '13:00', check_out_time: '11:00', active: true, created_at: new Date().toISOString()
    },
    {
      id: 'p3', name: 'Coral Beach Homestay', property_type: 'Homestay', location: 'North Goa',
      address: 'Beach Lane', city: 'Anjuna', state: 'Goa', pincode: '403509',
      phone: '9876543212', email: 'coral@serene.local', check_in_time: '14:00', check_out_time: '11:00',
      active: true, created_at: new Date().toISOString()
    },
    {
      id: 'p4', name: 'Pinecrest Cabin', property_type: 'Homestay', location: 'Old Manali',
      address: 'Orchard Road', city: 'Manali', state: 'Himachal Pradesh', pincode: '175131',
      phone: '9876543213', email: 'pine@serene.local', check_in_time: '12:00', check_out_time: '11:00',
      active: true, created_at: new Date().toISOString()
    },
    {
      id: 'p5', name: 'Oasis Business Hotel', property_type: 'Hotel', location: 'Tech Park',
      address: 'Ring Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560037',
      phone: '9876543214', email: 'oasis@serene.local', gstin: '29ABCDE1234F1Z5',
      check_in_time: '14:00', check_out_time: '12:00', active: true, created_at: new Date().toISOString()
    }
  ],
  customers: [
    { id: 'c1', name: 'Rahul Sharma', phone: '9123456701', email: 'rahul@example.local', created_at: new Date().toISOString() },
    { id: 'c2', name: 'Priya Patel', phone: '9123456702', email: 'priya@example.local', created_at: new Date().toISOString() },
    { id: 'c3', name: 'Ananya Desai', phone: '9123456703', created_at: new Date().toISOString() },
    { id: 'c4', name: 'Vikram Singh', phone: '9123456704', email: 'vikram@example.local', created_at: new Date().toISOString() },
    { id: 'c5', name: 'Neha Gupta', phone: '9123456705', created_at: new Date().toISOString() },
    { id: 'c6', name: 'Karthik Reddy', phone: '9123456706', email: 'karthik@example.local', created_at: new Date().toISOString() },
    { id: 'c7', name: 'Sonal Iyer', phone: '9123456707', created_at: new Date().toISOString() },
    { id: 'c8', name: 'Arjun Nair', phone: '9123456708', email: 'arjun@example.local', created_at: new Date().toISOString() },
    { id: 'c9', name: 'Meera Rao', phone: '9123456709', created_at: new Date().toISOString() },
    { id: 'c10', name: 'Rohan Mehta', phone: '9123456710', email: 'rohan@example.local', created_at: new Date().toISOString() }
  ],
  bookings: [
    {
      id: 'b1', booking_no: 'BK-1001', customer_id: 'c1', property_id: 'p1', check_in: '2023-11-01', check_out: '2023-11-04',
      nights: 3, rooms: 1, guests: 2, room_type: 'Deluxe', base_amount: 12000, tax_enabled: true, tax_rate: 18, tax_amount: 2160,
      grand_total: 14160, booking_status: 'Completed', payment_status: 'Fully Paid', created_at: new Date().toISOString()
    },
    {
      id: 'b2', booking_no: 'BK-1002', customer_id: 'c2', property_id: 'p2', check_in: '2023-11-05', check_out: '2023-11-08',
      nights: 3, rooms: 2, guests: 4, room_type: 'Suite', base_amount: 30000, tax_enabled: true, tax_rate: 18, tax_amount: 5400,
      grand_total: 35400, booking_status: 'Confirmed', payment_status: 'Partially Paid', created_at: new Date().toISOString()
    },
    {
      id: 'b3', booking_no: 'BK-1003', customer_id: 'c3', property_id: 'p3', check_in: '2023-11-10', check_out: '2023-11-12',
      nights: 2, rooms: 1, guests: 2, room_type: 'Standard', base_amount: 5000, tax_enabled: false, tax_rate: 0, tax_amount: 0,
      grand_total: 5000, booking_status: 'Confirmed', payment_status: 'Unpaid', created_at: new Date().toISOString()
    }
  ],
  payments: [
    {
      id: 'pay1', payment_no: 'PAY-8001', booking_id: 'b1', date: '2023-10-25', amount: 14160, method: 'UPI', ref_id: 'UPI123456', status: 'Completed', created_at: new Date().toISOString()
    },
    {
      id: 'pay2', payment_no: 'PAY-8002', booking_id: 'b2', date: '2023-11-01', amount: 10000, method: 'Card', ref_id: 'TXN789', status: 'Completed', created_at: new Date().toISOString()
    }
  ],
  notifications: []
};

class DemoRepositoryImpl implements IRepository {
  private db: DemoDB;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.db = JSON.parse(stored);
      } catch (e) {
        this.db = seedData;
        this.save();
      }
    } else {
      this.db = seedData;
      this.save();
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }

  // --- Properties ---
  async getProperties() { return [...this.db.properties]; }
  async getProperty(id: string) { return this.db.properties.find(p => p.id === id) || null; }
  async createProperty(data: Omit<Property, 'id' | 'created_at'>) {
    const prop: Property = { ...data, id: generateId('P-'), created_at: new Date().toISOString() };
    this.db.properties.push(prop);
    this.save();
    return prop;
  }
  async updateProperty(id: string, data: Partial<Property>) {
    const idx = this.db.properties.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Not found');
    this.db.properties[idx] = { ...this.db.properties[idx], ...data };
    this.save();
    return this.db.properties[idx];
  }

  // --- Customers ---
  async getCustomers() { return [...this.db.customers].reverse(); }
  async getCustomer(id: string) { return this.db.customers.find(c => c.id === id) || null; }
  async createCustomer(data: Omit<Customer, 'id' | 'created_at'>) {
    const cust: Customer = { ...data, id: generateId('C-'), created_at: new Date().toISOString() };
    this.db.customers.push(cust);
    this.save();
    return cust;
  }

  // --- Bookings ---
  async getBookings(propertyId?: string) {
    let bs = [...this.db.bookings];
    if (propertyId) bs = bs.filter(b => b.property_id === propertyId);
    return bs.reverse();
  }
  async getBooking(id: string) { return this.db.bookings.find(b => b.id === id) || null; }
  async createBooking(data: Omit<Booking, 'id' | 'created_at'>) {
    const booking: Booking = { ...data, id: generateId('B-'), created_at: new Date().toISOString() };
    this.db.bookings.push(booking);
    this.save();
    return booking;
  }
  async updateBooking(id: string, data: Partial<Booking>) {
    const idx = this.db.bookings.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Not found');
    this.db.bookings[idx] = { ...this.db.bookings[idx], ...data };
    this.save();
    return this.db.bookings[idx];
  }

  // --- Payments ---
  async getPayments(bookingId?: string) {
    let ps = [...this.db.payments];
    if (bookingId) ps = ps.filter(p => p.booking_id === bookingId);
    return ps.reverse();
  }
  async getAllPayments(propertyId?: string) {
    let ps = [...this.db.payments];
    if (propertyId) {
      const bIds = this.db.bookings.filter(b => b.property_id === propertyId).map(b => b.id);
      ps = ps.filter(p => bIds.includes(p.booking_id));
    }
    return ps.reverse();
  }
  async createPayment(data: Omit<Payment, 'id' | 'created_at'>) {
    const payment: Payment = { ...data, id: generateId('PAY-'), created_at: new Date().toISOString() };
    this.db.payments.push(payment);
    this.save();
    return payment;
  }

  // --- Notifications ---
  async getNotifications(bookingId?: string) {
    let ns = [...this.db.notifications];
    if (bookingId) ns = ns.filter(n => n.booking_id === bookingId);
    return ns.reverse();
  }
  async createNotification(data: Omit<Notification, 'id' | 'created_at'>) {
    const notif: Notification = { ...data, id: generateId('N-'), created_at: new Date().toISOString() };
    this.db.notifications.push(notif);
    this.save();
    return notif;
  }

  // --- Settings ---
  async getSettings() { return { ...this.db.settings }; }
  async updateSettings(data: Partial<BusinessSettings>) {
    this.db.settings = { ...this.db.settings, ...data };
    this.save();
    return this.db.settings;
  }

  async resetDemoData() {
    this.db = JSON.parse(JSON.stringify(seedData));
    this.save();
  }
}

export const DemoRepository = new DemoRepositoryImpl();
