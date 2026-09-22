import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Producto } from './producto.entity.js';

@Entity('categoria')
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'Id_categoria' })
  id: number;

  @Column({ name: 'nombre_categoria', type: 'varchar', length: 255, unique: true })
  nombreCategoria: string;

  @Column({ name: 'activo', type: 'int', default: 1 })
  activo: number;

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Producto[];
}
