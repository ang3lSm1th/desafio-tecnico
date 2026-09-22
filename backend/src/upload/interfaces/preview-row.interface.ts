
export interface PreviewRow {
  row: number;
  sku: string;
  nombre: string;
  categoria: string;
  action: 'INSERT' | 'UPDATE' | 'ERROR';
  status: 'valid' | 'invalid';
  data?: Record<string, any>;
  changes?: {
    stock?: { old: number; new: number };
    [key: string]: any;
  };
  errors?: string[];
}
