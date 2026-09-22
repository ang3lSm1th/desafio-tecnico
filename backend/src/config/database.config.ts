import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Categoria } from '../entities/categoria.entity.js';
import { Producto } from '../entities/producto.entity.js';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3307', 10),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_NAME ?? 'prueba_tecnica',
  entities: [Categoria, Producto],
  synchronize: false,
  charset: 'utf8mb4',
};
