import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';



export type TableName = keyof typeof TABLE_CONFIGS;

export interface ImportConfig {
  tableName: TableName;
  sheetName: string;
  mappings: { [key: string]: string };
}

export const readExcelFile = (file: File): Promise<{
  sheets: string[];
  preview: { [sheet: string]: any[] };
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets = workbook.SheetNames;
        const preview: { [sheet: string]: any[] } = {};
        
        sheets.forEach(sheet => {
          const worksheet = workbook.Sheets[sheet];
          preview[sheet] = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: '',
            blankrows: false
          }).slice(0, 5); // Preview first 5 rows
        });

        resolve({ sheets, preview });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const getTableFields = async (tableName: string) => {
  const { data, error } = await supabase
    .from(tableName)
    .select()
    .limit(1);

  if (error) throw error;

  // Get column names from the first row
  return data.length > 0 ? Object.keys(data[0]) : [];
};

export const deleteImportedData = async (tableName: TableName, olderThanHours?: number) => {
  try {
    let query = supabase.from(tableName).delete();

    if (olderThanHours) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);
      query = query.gte('created_at', cutoffTime.toISOString());
    }

    const { error } = await query;

    if (error) throw error;

    return {
      message: olderThanHours
        ? `تم حذف البيانات المستوردة في آخر ${olderThanHours} ساعة من ${TABLE_CONFIGS[tableName].name}`
        : `تم حذف جميع البيانات من ${TABLE_CONFIGS[tableName].name}`
    };
  } catch (error: any) {
    throw new Error(`فشل حذف البيانات: ${error.message}`);
  }
};

// A more robust and generic data import function
export const importData = async (file: File, config: ImportConfig) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[config.sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: "",
          blankrows: false,
        });

        const validRows: any[] = [];
        const errors: { row: number; message: string }[] = [];

        // Pre-fetch data for lookups if needed
        let customerMap = new Map();
        if (config.tableName === 'transactions' || config.tableName === 'payments') {
            const { data: customers } = await supabase.from('customers').select('id, sequence_number');
            if (!customers) throw new Error('Could not fetch customers for validation.');
            customers.forEach(c => {
                if (c.sequence_number) {
                    customerMap.set(c.sequence_number.toString(), c.id);
                }
            });
        }

        let transactionMap = new Map();
        if (config.tableName === 'payments') {
            const { data: transactions } = await supabase.from('transactions').select('id, sequence_number');
            if (!transactions) throw new Error('Could not fetch transactions for validation.');
            transactions.forEach(t => {
                if (t.sequence_number) {
                    transactionMap.set(t.sequence_number.toString(), t.id);
                }
            });
        }

        for (const [index, row] of jsonData.entries()) {
          const newRow: { [key: string]: any } = {};
          let rowHasError = false;

          for (const [sourceField, targetField] of Object.entries(config.mappings)) {
            if (rowHasError) continue;

            const value = row[sourceField];

            // Basic validation for required fields
            if (TABLE_CONFIGS[config.tableName].requiredFields.includes(targetField) && (value === undefined || value === '')) {
              errors.push({ row: index + 2, message: `الحقل المطلوب '${sourceField}' فارغ.` });
              rowHasError = true;
              continue;
            }

            if (value === undefined) continue;

            // --- Field-specific processing and validation ---
            try {
              switch (targetField) {
                // IDs
                case 'id':
                  newRow.id = value.toString();
                  // For customers, we also use the ID as the sequence number for linking
                  if (config.tableName === 'customers') {
                    newRow.sequence_number = value.toString();
                  }
                  break;
                case 'customer_id':
                  const customerId = customerMap.get(value.toString());
                  if (!customerId) throw new Error(`لم يتم العثور على عميل بالرقم '${value}'.`);
                  newRow.customer_id = customerId;
                  break;
                case 'transaction_id':
                  const transactionId = transactionMap.get(value.toString());
                  if (!transactionId) throw new Error(`لم يتم العثور على معاملة بالرقم '${value}'.`);
                  newRow.transaction_id = transactionId;
                  break;

                // Numeric fields
                case 'cost_price':
                case 'extra_price':
                case 'installment_amount':
                case 'amount':
                  const numValue = Number(value);
                  if (isNaN(numValue)) throw new Error(`القيمة '${value}' ليست رقماً صالحاً.`);
                  newRow[targetField] = numValue;
                  break;

                // Integer fields
                case 'number_of_installments':
                  const intValue = Number(value);
                  if (!Number.isInteger(intValue)) throw new Error(`القيمة '${value}' ليست رقماً صحيحاً.`);
                  newRow[targetField] = intValue;
                  break;

                // Date fields
                case 'start_date':
                case 'payment_date':
                  // XLSX reads dates as numbers, we need to convert them
                  const excelDate = Number(value);
                  if (isNaN(excelDate)) {
                    // If it's not a number, try parsing it as a string date
                    const parsedDate = new Date(value);
                    if (isNaN(parsedDate.getTime())) throw new Error(`التاريخ '${value}' غير صالح.`);
                    newRow[targetField] = parsedDate.toISOString().split('T')[0];
                  } else {
                    // Formula from https://stackoverflow.com/questions/16229494/converting-excel-date-serial-number-to-date-using-javascript
                    const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                    newRow[targetField] = jsDate.toISOString().split('T')[0];
                  }
                  break;

                default:
                  newRow[targetField] = value;
                  break;
              }
            } catch (error: any) {
              errors.push({ row: index + 2, message: `${error.message}` });
              rowHasError = true;
            }
          }

          if (!rowHasError) {
            // Add default values and derived fields
            if (config.tableName === 'transactions') {
                newRow.amount = (newRow.cost_price || 0) + (newRow.extra_price || 0);
                newRow.remaining_balance = newRow.amount;
                newRow.status = 'active';
            }
            validRows.push(newRow);
          }
        }

        if (errors.length > 0) {
          // If there are errors, do not import anything.
          // Resolve with error details for reporting.
          return resolve({
            imported: 0,
            errors: errors,
            message: `فشل الاستيراد. تم العثور على ${errors.length} أخطاء.`
          });
        }

        if (validRows.length === 0) {
          return resolve({ imported: 0, errors: [], message: 'لا توجد بيانات صالحة للاستيراد.' });
        }

        // Perform the insert operation
        const { error: insertError } = await supabase.from(config.tableName).insert(validRows);

        if (insertError) {
          // If Supabase returns an error, report it
          reject(new Error(`خطأ في قاعدة البيانات: ${insertError.message}`));
        } else {
          resolve({
            imported: validRows.length,
            errors: [],
            message: `تم استيراد ${validRows.length} سجلات بنجاح.`,
          });
        }

      } catch (error: any) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const TABLE_CONFIGS = {
  customers: {
    name: 'العملاء',
    requiredFields: ['full_name', 'mobile_number'],
    fields: [
      { value: 'id', label: 'كود' },
      { value: 'sequence_number', label: 'م العميل' },
      { value: 'full_name', label: 'الاسم الكامل' },
      { value: 'mobile_number', label: 'رقم الهاتف' },
      { value: 'mobile_number2', label: 'رقم الهاتف 2' },
      { value: 'civil_id', label: 'الرقم المدني' }
    ]
  },
  transactions: {
    name: 'المعاملات',
    requiredFields: ['customer_id', 'cost_price', 'extra_price', 'installment_amount', 'start_date'],
    fields: [
      { value: 'sequence_number', label: 'رقم البيع' },
      { value: 'customer_id', label: 'رقم العميل' },
      { value: 'cost_price', label: 'سعر السلعة' },
      { value: 'extra_price', label: 'السعر الاضافى' },
      { value: 'amount', label: 'إجمالي السعر' },
      { value: 'installment_amount', label: 'قيمة القسط' },
      { value: 'number_of_installments', label: 'عدد الدفعات' },
      { value: 'start_date', label: 'تاريخ البدء' },
      { value: 'notes', label: 'ملاحظات' },
      { value: 'status', label: 'الحالة', defaultValue: 'active' },
      { value: 'has_legal_case', label: 'قضية قانونية', defaultValue: false }
    ]
  },
  payments: {
    name: 'المدفوعات',
    requiredFields: ['transaction_id', 'customer_id', 'amount', 'payment_date'],
    fields: [
      { value: 'transaction_id', label: 'معرف المعاملة' },
      { value: 'customer_id', label: 'معرف العميل' },
      { value: 'amount', label: 'المبلغ' },
      { value: 'payment_date', label: 'تاريخ الدفع' },
      { value: 'notes', label: 'ملاحظات' }
    ]
  },

};
