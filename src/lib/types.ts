// Type definitions for the Arabic Installment Sales Management System

export interface Customer {
  id: string;
  fullName: string;
  mobileNumber: string;
  civilId: string;
  created_at: Date;
}

export interface Transaction {
  id: string;
  customerid: string;
  customerName?: string;
  mobileNumber?: string;
  transactiondate: Date;
  totalinstallments: number;
  installmentamount: number;
  firstinstallmentdate: Date;
  totalamount: number;
  amountpaid: number;
  remainingbalance: number;
  overdueinstallments: number;
  overdueamount: number;
  legalcase: boolean;
  legalcasedetails?: string;
  courtcollectiondata?: string;
  documents?: any;
  created_at: Date;
}

export interface Payment {
  id: string;
  transactionId: string;
  customerId: string;
  amount: number;
  paymentDate: Date;
  balanceBefore: number;
  balanceAfter: number;
  proofDocument?: string;
  notes?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalCustomers: number;
  totalActiveTransactions: number;
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
  overdueTransactions: number;
}

export type TransactionStatus = 'active' | 'completed' | 'overdue' | 'legal_case';

export interface ExportRow {
  description: string;
  amount: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  mobileNumber: string;
  dueDate: string;
  reference: string;
  notes: string;
  expiry: string;
}