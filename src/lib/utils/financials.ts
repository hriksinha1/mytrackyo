import { Booking, Payment } from '../repository/types';

export interface BookingPaymentSummary {
  totalAmount: number;
  totalPaid: number;
  totalRefunded: number;
  netPaid: number;
  balanceDue: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
}

export function calculateBookingPaymentSummary(
  booking: Booking | { grand_total: number },
  payments: Payment[]
): BookingPaymentSummary {
  const totalAmount = Number(booking.grand_total) || 0;
  
  let totalPaid = 0;
  let totalRefunded = 0;
  
  for (const p of payments) {
    const amt = Number(p.amount) || 0;
    // According to new rules: manual payments are 'Recorded', old ones might be 'Completed'
    if (p.status === 'Recorded' || p.status === 'Completed') {
      totalPaid += amt;
    } else if (p.status === 'Refunded') {
      totalRefunded += amt;
    }
  }
  
  const netPaid = totalPaid - totalRefunded;
  const balanceDue = Math.max(0, totalAmount - netPaid);
  
  let paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' = 'Unpaid';
  
  if (netPaid <= 0) {
    paymentStatus = 'Unpaid';
  } else if (netPaid < totalAmount) {
    paymentStatus = 'Partially Paid';
  } else {
    paymentStatus = 'Paid';
  }
  
  return {
    totalAmount,
    totalPaid,
    totalRefunded,
    netPaid,
    balanceDue,
    paymentStatus
  };
}
