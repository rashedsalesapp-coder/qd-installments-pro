import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from './Dashboard';
import { supabase } from '@/lib/supabaseClient';
import { AuthProvider } from '@/hooks/useAuth';

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    rpc: vi.fn(),
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

const mockDashboardStats = {
  total_customers: 10,
  total_active_transactions: 5,
  total_revenue: 10000,
  total_cost: 5000,
  total_profit: 5000,
  total_outstanding: 2000,
  total_overdue: 500,
  overdue_transactions: 2,
};

describe('Dashboard', () => {
  it('renders the dashboard stats correctly', async () => {
    // Mock the API response
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: mockDashboardStats, error: null });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('إجمالي العملاء')).toBeInTheDocument();
    });

    // Check if the stats are displayed
    expect(screen.getByText('١٠')).toBeInTheDocument();
    expect(screen.getByText('٥')).toBeInTheDocument();
    expect(screen.getByText(/١٠٬٠٠٠/)).toBeInTheDocument();
  });
});
