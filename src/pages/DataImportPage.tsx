import { useState } from 'react';
import Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importCustomers } from '@/lib/localApi';

const customerFields = [
  { value: 'fullName', label: 'الاسم الكامل' },
  { value: 'mobileNumber', label: 'رقم الهاتف' },
  { value: 'civilId', label: 'الرقم المدني' },
];

const DataImportPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});

  const mutation = useMutation({
    mutationFn: importCustomers,
    onSuccess: (data) => {
      toast({ title: "Success", description: data.message });
      queryClient.invalidateQueries({ queryKey: ['customers', 'dashboardStats'] });
      // Reset state after import
      setFile(null);
      setData([]);
      setHeaders([]);
      setMapping({});
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleParse = () => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setData(results.data);
        setMapping({});
      },
    });
  };

  const handleMappingChange = (header: string, value: string) => {
    setMapping(prev => ({ ...prev, [header]: value }));
  };

  const getMappedData = () => {
    return data.map(row => {
        const newRow: { [key: string]: any } = {};
        for (const header in mapping) {
            if (row[header]) {
                newRow[mapping[header]] = row[header];
            }
        }
        return newRow;
    }).filter(row => row.fullName && row.mobileNumber && row.civilId); // Basic validation
  };

  const mappedData = getMappedData();

  const validateMapping = () => {
      const mappedKeys = Object.values(mapping);
      const requiredKeys = ['fullName', 'mobileNumber', 'civilId'];
      return requiredKeys.every(key => mappedKeys.includes(key));
  };

  const isMappingValid = validateMapping();

  const handleImport = () => {
      mutation.mutate(mappedData);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">استيراد البيانات من CSV</h1>
      <div className="p-4 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">الخطوة 1: رفع الملف</h2>
        <div className="flex items-center gap-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} className="max-w-xs"/>
          <Button onClick={handleParse} disabled={!file}>تحليل الملف</Button>
        </div>
      </div>

      {headers.length > 0 && (
        <div className="p-4 mt-4 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-2">الخطوة 2: ربط الأعمدة</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {headers.map(header => (
              <div key={header}>
                <p className="font-bold">{header}</p>
                <Select onValueChange={(value) => handleMappingChange(header, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحقل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerFields.map(field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(mapping).length > 0 && (
        <div className="p-4 mt-4 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">الخطوة 3: معاينة البيانات والتحقق منها</h2>
            {isMappingValid ? (
                <>
                    <p className='text-sm text-muted-foreground mb-2'>
                        تم العثور على {mappedData.length} سجل صالح للاستيراد. سيتم تجاهل الصفوف التي لا تحتوي على جميع الحقول المطلوبة.
                    </p>
                    <div className="max-h-96 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {customerFields.map(field => (
                                        <TableHead key={field.value}>{field.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mappedData.slice(0, 10).map((row, i) => (
                                    <TableRow key={i}>
                                        {customerFields.map(field => (
                                            <TableCell key={field.value}>{row[field.value]}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleImport} disabled={mutation.isPending || mappedData.length === 0}>
                            {mutation.isPending ? 'جاري الاستيراد...' : `استيراد ${mappedData.length} سجلات`}
                        </Button>
                    </div>
                </>
            ) : (
                <p className="text-destructive">
                    يرجى ربط جميع الحقول المطلوبة (الاسم الكامل، رقم الهاتف، الرقم المدني) للمتابعة.
                </p>
            )}
        </div>
      )}
    </div>
  );
};

export default DataImportPage;
