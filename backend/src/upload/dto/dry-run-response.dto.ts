import { PreviewRow } from '../interfaces/preview-row.interface.js';

export class DryRunResponseDto {
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
