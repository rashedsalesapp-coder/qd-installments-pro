import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

export interface ImportMapping {
  sourceField: string;
  targetField: string;
}

export interface ImportConfig {
  tableName: string;
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

export const importData = async (
  file: File,
  config: ImportConfig
) => {
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const worksheet = workbook.Sheets[config.sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          blankrows: false
        });

        // Map the data according to the configuration
        const mappedData = jsonData.map(row => {
          const newRow: { [key: string]: any } = {};
          for (const [sourceField, targetField] of Object.entries(config.mappings)) {
            if (row[sourceField] !== undefined) {
              newRow[targetField] = row[sourceField];
            }
          }
          return newRow;
        });

        // Import to Supabase
        const { data: result, error } = await supabase
          .from(config.tableName)
          .insert(mappedData)
          .select();

        if (error) throw error;

        resolve({
          imported: mappedData.length,
          message: `Successfully imported ${mappedData.length} records to ${config.tableName}`
        });
      } catch (error) {
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
    requiredFields: ['fullName', 'mobileNumber', 'civilId'],
    fields: [
      { value: 'fullName', label: 'الاسم الكامل' },
      { value: 'mobileNumber', label: 'رقم الهاتف' },
      { value: 'civilId', label: 'الرقم المدني' }
    ]
  },
  transactions: {
    name: 'المعاملات',
    requiredFields: ['customerId', 'amount', 'installmentAmount', 'startDate'],
    fields: [
      { value: 'customerId', label: 'معرف العميل' },
      { value: 'amount', label: 'المبلغ الإجمالي' },
      { value: 'installmentAmount', label: 'قيمة القسط' },
      { value: 'startDate', label: 'تاريخ البدء' },
      { value: 'numberOfInstallments', label: 'عدد الأقساط' },
      { value: 'notes', label: 'ملاحظات' }
    ]
  },
  payments: {
    name: 'المدفوعات',
    requiredFields: ['transactionId', 'amount', 'paymentDate'],
    fields: [
      { value: 'transactionId', label: 'معرف المعاملة' },
      { value: 'amount', label: 'المبلغ' },
      { value: 'paymentDate', label: 'تاريخ الدفع' },
      { value: 'notes', label: 'ملاحظات' }
    ]
  }
};
