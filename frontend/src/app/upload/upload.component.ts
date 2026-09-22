import { Component } from '@angular/core';
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

  constructor(private uploadService: UploadService) {}

  // =========================================================================
  //  TRANSICIONES DE ESTADO
  // =========================================================================

  /** IDLE → UPLOADING: Usuario selecciona archivo y se envía */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
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

    this.uploadService.uploadFile(this.selectedFile).subscribe({
      next: (response) => {
        this.dryRunResponse = response;
        this.currentState = UploadState.PREVIEW;
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || err.message || 'Error al procesar el archivo';
        this.currentState = UploadState.ERROR;
      },
    });
  }

  /** PREVIEW → muestra diálogo de confirmación */
  onConfirmClick(): void {
    this.showConfirmDialog = true;
  }

  /** Diálogo → cancela la confirmación */
  onCancelConfirm(): void {
    this.showConfirmDialog = false;
  }

  /** Diálogo → COMMITTING: confirma y ejecuta */
  onDoubleConfirm(): void {
    this.showConfirmDialog = false;

    if (!this.dryRunResponse) return;

    this.currentState = UploadState.COMMITTING;

    this.uploadService
      .commitUpload(this.dryRunResponse.previewToken)
      .subscribe({
        next: (response) => {
          this.commitResponse = response;
          this.currentState = UploadState.RESULT;
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || err.message || 'Error al ejecutar el commit';
          this.currentState = UploadState.ERROR;
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
