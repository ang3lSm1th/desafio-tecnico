import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UploadState,
  DryRunResponse,
  CommitResponse,
  PreviewRow,
} from './models/upload.models';
import { UploadService } from './upload.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css',
})
export class UploadComponent {
  // ── State Machine ──
  currentState: UploadState = UploadState.IDLE;
  readonly UploadState = UploadState;

  // ── Data ──
  selectedFile: File | null = null;
  dryRunResponse: DryRunResponse | null = null;
  commitResponse: CommitResponse | null = null;
  errorMessage: string = '';
  showConfirmDialog: boolean = false;

  // ── Drag & Drop ──
  isDragging: boolean = false;

  constructor(
    private uploadService: UploadService,
    private cdr: ChangeDetectorRef,
  ) {}

  // =========================================================================
  //  TRANSICIONES DE ESTADO
  // =========================================================================

  /** IDLE → UPLOADING: Usuario selecciona archivo y se envía */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      input.value = ''; // Permite volver a seleccionar el mismo archivo si es necesario
      this.startUpload();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        this.selectedFile = file;
        this.startUpload();
      } else {
        this.errorMessage = 'Solo se permiten archivos .xlsx';
        this.currentState = UploadState.ERROR;
      }
    }
  }

  /** Envía el archivo al backend (Dry Run) */
  private startUpload(): void {
    if (!this.selectedFile) return;

    this.currentState = UploadState.UPLOADING;
    this.errorMessage = '';
    this.cdr.detectChanges();

    console.log('🚀 [UploadComponent] Enviando archivo:', this.selectedFile.name);

    this.uploadService.uploadFile(this.selectedFile).subscribe({
      next: (response) => {
        console.log('✅ [UploadComponent] Respuesta DryRun:', response);
        this.dryRunResponse = response;
        this.currentState = UploadState.PREVIEW;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [UploadComponent] Error en uploadFile:', err);
        const serverMsg = err.error?.message;
        if (Array.isArray(serverMsg)) {
          this.errorMessage = serverMsg.join('. ');
        } else if (typeof serverMsg === 'string') {
          this.errorMessage = serverMsg;
        } else if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar con el backend en http://localhost:3000. Revisa que el backend esté corriendo y la base de datos conectada.';
        } else if (err.message) {
          this.errorMessage = err.message;
        } else {
          this.errorMessage = 'Error inesperado al procesar el archivo.';
        }
        this.currentState = UploadState.ERROR;
        this.cdr.detectChanges();
      },
    });
  }

  /** PREVIEW → muestra diálogo de confirmación */
  onConfirmClick(): void {
    this.showConfirmDialog = true;
    this.cdr.detectChanges();
  }

  /** Diálogo → cancela la confirmación */
  onCancelConfirm(): void {
    this.showConfirmDialog = false;
    this.cdr.detectChanges();
  }

  /** Diálogo → COMMITTING: confirma y ejecuta */
  onDoubleConfirm(): void {
    this.showConfirmDialog = false;

    if (!this.dryRunResponse) return;

    this.currentState = UploadState.COMMITTING;
    this.cdr.detectChanges();

    console.log('🚀 [UploadComponent] Confirmando commit con token:', this.dryRunResponse.previewToken);

    this.uploadService
      .commitUpload(this.dryRunResponse.previewToken)
      .subscribe({
        next: (response) => {
          console.log('✅ [UploadComponent] Respuesta Commit:', response);
          this.commitResponse = response;
          this.currentState = UploadState.RESULT;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ [UploadComponent] Error en commitUpload:', err);
          const serverMsg = err.error?.message;
          if (Array.isArray(serverMsg)) {
            this.errorMessage = serverMsg.join('. ');
          } else if (typeof serverMsg === 'string') {
            this.errorMessage = serverMsg;
          } else if (err.status === 0) {
            this.errorMessage = 'No se pudo conectar con el backend en http://localhost:3000 al intentar guardar los cambios.';
          } else if (err.message) {
            this.errorMessage = err.message;
          } else {
            this.errorMessage = 'Error al ejecutar la confirmación en la base de datos.';
          }
          this.currentState = UploadState.ERROR;
          this.cdr.detectChanges();
        },
      });
  }

  /** PREVIEW → IDLE: cancela y vuelve al inicio */
  onCancelUpload(): void {
    this.resetState();
  }

  /** ERROR → IDLE: reintentar */
  onRetry(): void {
    this.resetState();
  }

  /** RESULT → IDLE: cargar otro archivo */
  onNewUpload(): void {
    this.resetState();
  }

  private resetState(): void {
    this.currentState = UploadState.IDLE;
    this.selectedFile = null;
    this.dryRunResponse = null;
    this.commitResponse = null;
    this.errorMessage = '';
    this.showConfirmDialog = false;
    this.cdr.detectChanges();
  }

  // =========================================================================
  //  HELPERS PARA EL TEMPLATE
  // =========================================================================

  get validRows(): PreviewRow[] {
    return this.dryRunResponse?.details.filter((d) => d.status === 'valid') ?? [];
  }

  get invalidRows(): PreviewRow[] {
    return this.dryRunResponse?.details.filter((d) => d.status === 'invalid') ?? [];
  }

  get hasValidRows(): boolean {
    return this.validRows.length > 0;
  }
}
