/**
 * Estados de la máquina de estados del componente Upload.
 */
export enum UploadState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PREVIEW = 'PREVIEW',
  COMMITTING = 'COMMITTING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
}

/**
 * Fila del preview retornada por el backend.
 */
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

/**
 * Respuesta del Dry Run (Phase 1).
 */
export interface DryRunResponse {
  success: boolean;
  summary: {
    total: number;
    toInsert: number;
    toUpdate: number;
    errors: number;
  };
  details: PreviewRow[];
  previewToken: string;
}

/**
 * Respuesta del Commit (Phase 2).
 */
export interface CommitResponse {
  success: boolean;
  summary: {
    inserted: number;
    updated: number;
    failed: number;
  };
  message: string;
}
