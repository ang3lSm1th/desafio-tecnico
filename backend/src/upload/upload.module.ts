import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { Producto } from '../entities/producto.entity.js';
import { Categoria } from '../entities/categoria.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Categoria])],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
