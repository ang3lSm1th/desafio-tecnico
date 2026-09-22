import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DryRunResponse, CommitResponse } from './models/upload.models';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly apiUrl = 'http://localhost:3000/api/upload';

  constructor(private http: HttpClient) {}

  /**
   * Phase 1: Envía el archivo Excel al backend para Dry Run.
   */
  uploadFile(file: File): Observable<DryRunResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DryRunResponse>(this.apiUrl, formData);
  }

  /**
   * Phase 2: Envía el token de preview para ejecutar el commit.
   */
  commitUpload(previewToken: string): Observable<CommitResponse> {
    return this.http.post<CommitResponse>(`${this.apiUrl}/commit`, {
      previewToken,
    });
  }
}
