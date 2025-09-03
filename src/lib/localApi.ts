import { Customer, Transaction, Payment, DashboardStats } from './types';

const FAKE_API_LATENCY = 300;

// --- Utility Functions ---
const getFromStorage = <T>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
};

const saveToStorage = <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- Initial Data Setup ---
const initializeData = () => {
    if (!localStorage.getItem('customers')) {
        saveToStorage<Customer[]>('customers', []);
    }
    if (!localStorage.getItem('transactions')) {
        saveToStorage<Transaction[]>('transactions', []);
    }
    if (!localStorage.getItem('payments')) {
        saveToStorage<Payment[]>('payments', []);
    }
    // Add default admin user for login
    if (!localStorage.getItem('users')) {
        saveToStorage('users', [{ username: 'admin', password: 'admin' }]);
    }
};

initializeData();

// --- Customer API ---
export const getCustomers = async (): Promise<Customer[]> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    return getFromStorage<Customer[]>('customers', []);
};

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    const customers = await getCustomers();
    const newCustomer: Customer = {
        ...customerData,
        id: `CUS${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    customers.push(newCustomer);
    saveToStorage('customers', customers);
    return newCustomer;
};

export const updateCustomer = async (customerData: Customer): Promise<Customer> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    let customers = await getCustomers();
    customers = customers.map(c => c.id === customerData.id ? {...c, ...customerData, updatedAt: new Date()} : c);
    saveToStorage('customers', customers);
    return customerData;
};

// --- Transaction API ---
export const getTransactions = async (): Promise<Transaction[]> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    const transactions = getFromStorage<Transaction[]>('transactions', []);
    const customers = await getCustomers();
    return transactions.map(t => ({
        ...t,
        customerName: customers.find(c => c.id === t.customerId)?.fullName || 'Unknown',
        mobileNumber: customers.find(c => c.id === t.customerId)?.mobileNumber || '',
    }));
};

export const addTransaction = async (data: any): Promise<Transaction> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    const transactions = await getTransactions();
    const totalAmount = data.totalInstallments * data.monthlyInstallmentAmount;
    const newTransaction: any = {
        ...data,
        id: `TRN${Date.now()}`,
        totalAmount,
        remainingBalance: totalAmount,
        totalPaid: 0,
        overdueInstallments: 0,
        overdueAmount: 0,
        isCompleted: false,
        hasLegalCase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    transactions.push(newTransaction);
    saveToStorage('transactions', transactions);
    return newTransaction;
};

export const updateTransaction = async (data: Transaction): Promise<Transaction> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    let transactions = getFromStorage<Transaction[]>('transactions', []);
    transactions = transactions.map(t => t.id === data.id ? {...t, ...data, updatedAt: new Date()} : t);
    saveToStorage('transactions', transactions);
    return data;
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    let transactions = getFromStorage<Transaction[]>('transactions', []);
    transactions = transactions.filter(t => t.id !== transactionId);
    saveToStorage('transactions', transactions);
};

// --- Payment API ---
export const recordPayment = async (paymentData: { transactionId: string; amount: number; }): Promise<any> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    let transactions = getFromStorage<Transaction[]>('transactions', []);
    let payments = getFromStorage<Payment[]>('payments', []);
    const targetTransaction = transactions.find(t => t.id === paymentData.transactionId);

    if (targetTransaction) {
        const newPaid = targetTransaction.totalPaid + paymentData.amount;
        const newRemaining = targetTransaction.totalAmount - newPaid;

        const updatedTransaction = {
            ...targetTransaction,
            totalPaid: newPaid,
            remainingBalance: newRemaining,
            isCompleted: newRemaining <= 0,
        };

        transactions = transactions.map(t => t.id === paymentData.transactionId ? updatedTransaction : t);
        saveToStorage('transactions', transactions);

        const newPayment: any = {
            id: `PAY${Date.now()}`,
            transactionId: paymentData.transactionId,
            amount: paymentData.amount,
            paymentDate: new Date(),
        };
        payments.push(newPayment);
        saveToStorage('payments', payments);
    }
    return { success: true };
};

// --- Import API ---
export const importCustomers = async (newCustomers: any[]): Promise<any> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    const customers = await getCustomers();
    const formattedCustomers = newCustomers.map(nc => ({
        ...nc,
        id: `CUS-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
    const updatedCustomers = [...customers, ...formattedCustomers];
    saveToStorage('customers', updatedCustomers);
    return { message: `${newCustomers.length} customers imported successfully.` };
};

// --- Report & Stats API ---
export const getReportableTransactions = async (): Promise<Transaction[]> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    const transactions = await getTransactions();
    return transactions.filter(t => t.remainingBalance > 0 && !t.hasLegalCase);
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    const customers = await getCustomers();
    const transactions = await getTransactions();

    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalOutstanding = transactions.reduce((sum, t) => sum + t.remainingBalance, 0);
    const totalOverdue = transactions.reduce((sum, t) => sum + t.overdueAmount, 0);

    return {
      totalCustomers: customers.length,
      totalActiveTransactions: transactions.filter(t => t.remainingBalance > 0).length,
      totalRevenue,
      totalOutstanding,
      totalOverdue,
      overdueTransactions: transactions.filter(t => t.overdueAmount > 0).length,
    };
};

// --- Overdue Check API ---
export const checkOverdueTransactions = async (): Promise<{ message: string }> => {
    await new Promise(r => setTimeout(r, FAKE_API_LATENCY));
    let transactions = getFromStorage<Transaction[]>('transactions', []);
    const today = new Date();
    let updates = 0;

    transactions.forEach(t => {
        if (t.remainingBalance <= 0 || t.hasLegalCase) return;

        const firstDueDate = new Date(t.firstInstallmentDueDate);
        const totalPaid = t.totalAmount - t.remainingBalance;
        const paidInstallments = Math.floor(totalPaid / t.monthlyInstallmentAmount);

        let monthsPassed = (today.getFullYear() - firstDueDate.getFullYear()) * 12;
        monthsPassed -= firstDueDate.getMonth();
        monthsPassed += today.getMonth();

        const expectedPaidInstallments = monthsPassed < 0 ? 0 : monthsPassed + 1;
        const overdueInstallments = Math.max(0, expectedPaidInstallments - paidInstallments);
        const overdueAmount = overdueInstallments * t.monthlyInstallmentAmount;

        if (t.overdueInstallments !== overdueInstallments || t.overdueAmount !== overdueAmount) {
            t.overdueInstallments = overdueInstallments;
            t.overdueAmount = overdueAmount;
            updates++;
        }
    });

    saveToStorage('transactions', transactions);
    return { message: `Overdue status checked. ${updates} transactions updated.` };
};
