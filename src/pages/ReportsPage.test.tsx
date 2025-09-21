import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import ReportsPage from './ReportsPage';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  },
}));

// Mock XLSX
vi.mock('xlsx', async () => {
    const actual = await vi.importActual('xlsx');
    return {
        ...actual,
        writeFile: vi.fn(),
        utils: {
            ...actual.utils,
            json_to_sheet: vi.fn(),
            book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
            book_append_sheet: vi.fn(),
        },
    };
});

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
    created_at: '2024-01-01T00:00:00Z',
    installment_amount: 100,
    number_of_installments: 12,
    remaining_balance: 1000,
    customers: { full_name: 'John Doe', mobile_number: '123456789' },
  },
];

describe('ReportsPage', () => {
  it('generates the report with correct data and options', async () => {
    // Mock the API response
    (supabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
    }));


    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>
    );

    // Wait for the button to be enabled
    const button = await screen.findByRole('button', { name: /إنشاء وتنزيل التقرير/i });
    expect(button).toBeEnabled();

    // Click the button
    fireEvent.click(button);

    // Check if json_to_sheet was called with the correct options
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        skipHeader: true,
      })
    );

    // Check if the data passed to json_to_sheet has the correct firstName
    const call = (XLSX.utils.json_to_sheet as vi.Mock).mock.calls[0];
    const reportData = call[0];
    expect(reportData[0].firstName).toBe('John Doe');
    expect(reportData[0].mobileNumber).toBe('965123456789');
  });
});
