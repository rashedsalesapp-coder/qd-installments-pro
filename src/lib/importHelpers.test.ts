import { describe, it, expect, vi } from 'vitest';
import { deleteImportedData } from './importHelpers';
import { supabase } from './supabaseClient';

describe('deleteImportedData', () => {
  it('should call gte when olderThanHours is provided', async () => {
    const fromSpy = vi.spyOn(supabase, 'from');
    const deleteSpy = vi.fn();
    const gteSpy = vi.fn();

    // @ts-ignore
    fromSpy.mockReturnValue({
        delete: deleteSpy.mockReturnValue({
            gte: gteSpy
        })
    });

    await deleteImportedData('customers', 1);

    expect(fromSpy).toHaveBeenCalledWith('customers');
    expect(deleteSpy).toHaveBeenCalled();
    expect(gteSpy).toHaveBeenCalled();
  });
});
