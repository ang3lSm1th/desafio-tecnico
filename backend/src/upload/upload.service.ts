import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

import { Producto } from '../entities/producto.entity.js';
import { Categoria } from '../entities/categoria.entity.js';
import { ExcelRow } from './interfaces/excel-row.interface.js';
import { PreviewRow } from './interfaces/preview-row.interface.js';
import { DryRunResponseDto } from './dto/dry-run-response.dto.js';
import { CommitResponseDto } from './dto/commit-response.dto.js';


interface CachedPreview {
  validRows: {
    action: 'INSERT' | 'UPDATE';
    data: ExcelRow;
    categoriaId: number;
    existingProductId?: number;
  }[];
  createdAt: Date;
}

@Injectable()
export class UploadService {

  private previewCache = new Map<string, CachedPreview>();

  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    private readonly dataSource: DataSource,
  ) { }

  async dryRun(fileBuffer: Buffer): Promise<DryRunResponseDto> {
    const rows = this.parseExcel(fileBuffer);

    if (rows.length === 0) {
      throw new BadRequestException(
        'El archivo Excel está vacío o no tiene datos válidos',
      );
    }

    const details: PreviewRow[] = [];
    const validRows: CachedPreview['validRows'] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      const errors = this.validateRow(row);

      if (errors.length > 0) {
        details.push({
          row: rowNumber,
          sku: row.sku || '(vacío)',
          nombre: row.nombre || '(vacío)',
          categoria: row.categoria || '(vacío)',
          action: 'ERROR',
          status: 'invalid',
          errors,
        });
        continue;
      }

      const categoria = await this.categoriaRepository.findOne({
        where: { nombreCategoria: row.categoria },
      });

      if (!categoria) {
        details.push({
          row: rowNumber,
          sku: row.sku,
          nombre: row.nombre,
          categoria: row.categoria,
          action: 'ERROR',
          status: 'invalid',
          errors: [
            `Categoría '${row.categoria}' no encontrada en la base de datos`,
          ],
        });
        continue;
      }

      const existingProduct = await this.productoRepository.findOne({
        where: { sku: row.sku },
      });

      if (existingProduct) {
        details.push({
          row: rowNumber,
          sku: row.sku,
          nombre: row.nombre,
          categoria: row.categoria,
          action: 'UPDATE',
          status: 'valid',
          changes: {
            stock: { old: existingProduct.stock, new: row.cantidad },
          },
        });
        validRows.push({
          action: 'UPDATE',
          data: row,
          categoriaId: categoria.id,
          existingProductId: existingProduct.id,
        });
      } else {

        details.push({
          row: rowNumber,
          sku: row.sku,
          nombre: row.nombre,
          categoria: row.categoria,
          action: 'INSERT',
          status: 'valid',
          data: {
            nombre: row.nombre,
            sku: row.sku,
            stock: row.cantidad,
            color: row.color,
            talla: row.talla,
            modelo: row.modelo,
            estado: row.activo ?? true,
          },
        });
        validRows.push({
          action: 'INSERT',
          data: row,
          categoriaId: categoria.id,
        });
      }
    }

    const previewToken = uuidv4();
    this.previewCache.set(previewToken, {
      validRows,
      createdAt: new Date(),
    });

    setTimeout(
      () => {
        this.previewCache.delete(previewToken);
      },
      10 * 60 * 1000,
    );

    const toInsert = details.filter((d) => d.action === 'INSERT').length;
    const toUpdate = details.filter((d) => d.action === 'UPDATE').length;
    const errorsCount = details.filter((d) => d.action === 'ERROR').length;

    return {
      success: true,
      summary: {
        total: rows.length,
        toInsert,
        toUpdate,
        errors: errorsCount,
      },
      details,
      previewToken,
    };
  }

  async commit(previewToken: string): Promise<CommitResponseDto> {
    const cached = this.previewCache.get(previewToken);

    if (!cached) {
      throw new NotFoundException(
        'Token de preview no encontrado o expirado. Por favor, realice un nuevo upload.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    try {
      for (const operation of cached.validRows) {
        if (operation.action === 'INSERT') {
          const producto = queryRunner.manager.create(Producto, {
            nombre: operation.data.nombre,
            sku: operation.data.sku,
            idCategoria: operation.categoriaId,
            stock: operation.data.cantidad,
            color: operation.data.color,
            talla: operation.data.talla,
            modelo: operation.data.modelo,
            estado: operation.data.activo ?? true,
          });
          await queryRunner.manager.save(producto);
          inserted++;
        } else if (operation.action === 'UPDATE') {
          await queryRunner.manager.update(
            Producto,
            { id: operation.existingProductId },
            { stock: operation.data.cantidad },
          );
          updated++;
        }
      }

      await queryRunner.commitTransaction();

      this.previewCache.delete(previewToken);
      return {
        success: true,
        summary: { inserted, updated, failed },
        message: `Inventario actualizado correctamente. ${inserted} productos insertados, ${updated} productos actualizados.`,
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.previewCache.delete(previewToken);

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      return {
        success: false,
        summary: { inserted: 0, updated: 0, failed: cached.validRows.length },
        message: `Error al ejecutar el commit. Se realizó ROLLBACK. Detalle: ${errorMessage}`,
      };
    } finally {
      await queryRunner.release();
    }
  }

  private parseExcel(buffer: Buffer): ExcelRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
    });

    return rawData.map((raw) => ({
      nombre: this.trimString(raw['Nombre Producto'] ?? raw['nombre']),
      sku: this.trimString(raw['SKU'] ?? raw['sku']),
      categoria: this.trimString(raw['Categoría'] ?? raw['Categoria'] ?? raw['categoria']),
      cantidad: this.parseNumber(raw['Cantidad'] ?? raw['cantidad'] ?? raw['stock']),
      color: this.trimString(raw['Color'] ?? raw['color']),
      talla: this.trimString(raw['Talla'] ?? raw['talla']) || null,
      modelo: this.trimString(raw['Modelo'] ?? raw['modelo']),
      activo: this.parseBoolean(raw['Activo'] ?? raw['activo'] ?? raw['estado']),
    }));
  }

  private validateRow(row: ExcelRow): string[] {
    const errors: string[] = [];

    if (!row.nombre || row.nombre.trim() === '') {
      errors.push('El campo "Nombre Producto" es requerido');
    }
    if (!row.sku || row.sku.trim() === '') {
      errors.push('El campo "SKU" es requerido');
    }
    if (!row.categoria || row.categoria.trim() === '') {
      errors.push('El campo "Categoría" es requerido');
    }
    if (row.cantidad === null || row.cantidad === undefined || isNaN(row.cantidad)) {
      errors.push('El campo "Cantidad" es requerido y debe ser un número');
    } else if (!Number.isInteger(row.cantidad) || row.cantidad <= 0) {
      errors.push('El campo "Cantidad" debe ser un número entero positivo');
    }
    if (!row.color || row.color.trim() === '') {
      errors.push('El campo "Color" es requerido');
    }
    if (!row.modelo || row.modelo.trim() === '') {
      errors.push('El campo "Modelo" es requerido');
    }

    return errors;
  }

  private trimString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private parseNumber(value: unknown): number {
    if (value === null || value === undefined) return NaN;
    const num = Number(value);
    return isNaN(num) ? NaN : num;
  }

  private parseBoolean(value: unknown): boolean | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const str = String(value).toLowerCase().trim();
    if (['true', '1', 'si', 'sí', 'activo'].includes(str)) return true;
    if (['false', '0', 'no', 'inactivo'].includes(str)) return false;
    return null;
  }
}
