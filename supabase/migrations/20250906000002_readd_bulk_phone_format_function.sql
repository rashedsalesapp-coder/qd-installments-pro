CREATE OR REPLACE FUNCTION public.bulk_add_plus_to_phones()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER := 0;
  count1 INTEGER;
  count2 INTEGER;
BEGIN
  -- Update mobile_number
  WITH updated_rows AS (
    UPDATE public.customers
    SET mobile_number = '+' || mobile_number
    WHERE mobile_number IS NOT NULL AND mobile_number != '' AND mobile_number NOT LIKE '+%'
    RETURNING 1
  )
  SELECT count(*) INTO count1 FROM updated_rows;

  -- Update alternate_phone
  WITH updated_rows2 AS (
    UPDATE public.customers
    SET alternate_phone = '+' || alternate_phone
    WHERE alternate_phone IS NOT NULL AND alternate_phone != '' AND alternate_phone NOT LIKE '+%'
    RETURNING 1
  )
  SELECT count(*) INTO count2 FROM updated_rows2;

  updated_count := count1 + count2;

  RETURN 'تم تحديث ' || updated_count || ' من أرقام الهواتف.';
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.bulk_add_plus_to_phones() TO authenticated;
