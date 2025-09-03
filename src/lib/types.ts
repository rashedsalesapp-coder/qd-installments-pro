// Type definitions for the Arabic Installment Sales Management System

export interface Customer {
  id: string;
  fullName: string;
  mobileNumber: string;
  civilId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  mobileNumber?: string; // Optional because it's only fetched for the report
  transactionDate: Date;
  totalInstallments: number;
  monthlyInstallmentAmount: number;
  firstInstallmentDueDate: Date;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  overdueInstallments: number;
  overdueAmount: number;
  isCompleted: boolean;
  hasLegalCase: boolean;
  legalCaseDetails?: string;
  documents?: string[];
  createdAt: Date;
  updatedAt: Date;
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