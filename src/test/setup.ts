import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => {
  const mockDelete = vi.fn().mockReturnThis();
  const mockGte = vi.fn();

  const from = vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    delete: vi.fn(() => ({
        gte: mockGte
    })),
  }));

  const supabase = {
    from,
  };

  return {
    createClient: vi.fn(() => supabase),
  };
});
