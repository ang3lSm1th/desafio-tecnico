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
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }


    const originalName = file.originalname.toLowerCase();
    if (!originalName.endsWith('.xlsx')) {
      throw new BadRequestException(
        'El archivo debe ser un Excel con extensión .xlsx',
      );
    }

    return this.uploadService.dryRun(file.buffer);
  }


  @Post('commit')
  async commit(@Body() body: CommitRequestDto): Promise<CommitResponseDto> {
    return this.uploadService.commit(body.previewToken);
  }
}
