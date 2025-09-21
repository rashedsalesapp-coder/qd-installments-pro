import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import TransactionsPage from './TransactionsPage';
import { supabase } from '@/lib/supabaseClient';
import { AuthProvider } from '@/hooks/useAuth';

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: '123' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    }
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockTransactions = [
  {
    id: '1',
    sequence_number: 1,
    customer_id: '1',
    cost_price: 100,
    extra_price: 20,
    amount: 120,
    profit: 20,
    installment_amount: 30,
    start_date: '2024-01-01',
    number_of_installments: 4,
    remaining_balance: 60,
    status: 'active',
    has_legal_case: false,
    notes: '',
    created_at: '2024-01-01T00:00:00Z',
    customers: { id: '1', full_name: 'John Doe', mobile_number: '123456789' },
  },
];

const mockCustomers = [
    { id: '1', full_name: 'John Doe', mobile_number: '123456789', civil_id: "123456789" },
    { id: '2', full_name: 'Jane Smith', mobile_number: '987654321', civil_id: "987654321" },
];

describe('TransactionsPage', () => {
  it('renders the transaction list correctly', async () => {
    // Mock the API responses
    (supabase.from as vi.Mock).mockImplementation((table: string) => {
        if (table === 'transactions') {
            return {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
            };
        }
        if (table === 'customers') {
            return {
                select: vi.fn().mockResolvedValue({ data: mockCustomers, error: null }),
            };
        }
        return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
        }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TransactionsPage />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check if the transaction data is displayed
    expect(screen.getByText(/١٢٠٫٠٠٠/)).toBeInTheDocument();
    expect(screen.getByText('نشطة')).toBeInTheDocument();
  });
});
