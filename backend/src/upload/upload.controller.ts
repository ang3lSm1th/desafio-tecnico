import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { UploadService } from './upload.service.js';
import { CommitRequestDto } from './dto/commit-request.dto.js';
import { DryRunResponseDto } from './dto/dry-run-response.dto.js';
import { CommitResponseDto } from './dto/commit-response.dto.js';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }


  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async dryRun(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DryRunResponseDto> {
    console.log(`📥 [POST /api/upload] Archivo recibido: "${file?.originalname}" | Tamaño: ${file?.size ?? 0} bytes`);

    if (!file) {
      console.warn('⚠️ [POST /api/upload] No se proporcionó ningún archivo');
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const originalName = file.originalname.toLowerCase();
    if (!originalName.endsWith('.xlsx')) {
      console.warn(`⚠️ [POST /api/upload] Formato no permitido: "${file.originalname}"`);
      throw new BadRequestException(
        'El archivo debe ser un Excel con extensión .xlsx',
      );
    }

    try {
      const result = await this.uploadService.dryRun(file.buffer);
      console.log(`✅ [POST /api/upload] DryRun exitoso: ${result.summary.total} filas analizadas`);
      return result;
    } catch (error) {
      console.error('❌ [POST /api/upload] Error durante dryRun:', error);
      throw error;
    }
  }

  @Post('commit')
  async commit(@Body() body: CommitRequestDto): Promise<CommitResponseDto> {
    console.log(`📥 [POST /api/upload/commit] PreviewToken recibido: "${body?.previewToken}"`);
    try {
      const result = await this.uploadService.commit(body.previewToken);
      console.log(`✅ [POST /api/upload/commit] Commit finalizado: ${result.message}`);
      return result;
    } catch (error) {
      console.error('❌ [POST /api/upload/commit] Error durante commit:', error);
      throw error;
    }
  }
}
