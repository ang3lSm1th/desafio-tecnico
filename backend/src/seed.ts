import mysql from 'mysql2/promise';

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'prueba_tecnica',
  });

  console.log('Conectado a MySQL...');

  // 1. Insertar categorias base si no existen
  const [existingCats] = await connection.query('SELECT * FROM categoria');
  if ((existingCats as any[]).length === 0) {
    await connection.query(`
      INSERT INTO categoria (nombre_categoria, activo) VALUES
      ('Ropa', 1),
      ('Calzado', 1),
      ('Accesorios', 1),
      ('Deportes', 1),
      ('Electrónica', 1)
    `);
    console.log('Categorias base insertadas: Ropa, Calzado, Accesorios, Deportes, Electronica');
  } else {
    console.log('Categorias ya existen en la base de datos:', (existingCats as any[]).length);
  }

  // 2. Insertar un producto previo con SKU 'POL-001' para testear UPDATE de stock
  const [existingProds] = await connection.query('SELECT * FROM producto WHERE sku = ?', ['POL-001']);
  if ((existingProds as any[]).length === 0) {
    const [ropaCat] = await connection.query('SELECT Id_categoria FROM categoria WHERE nombre_categoria = ?', ['Ropa']);
    const idCat = (ropaCat as any[])[0].Id_categoria;
    await connection.query(`
      INSERT INTO producto (nombre, sku, id_categoria, stock, color, talla, modelo, estado)
      VALUES ('Polera Deportiva DryFit', 'POL-001', ?, 10, 'Negro', 'M', 'Sport2026', 1)
    `, [idCat]);
    console.log('Producto inicial POL-001 insertado con stock inicial = 10 para probar UPDATE.');
  } else {
    console.log('Producto POL-001 ya existe en la base de datos.');
  }

  await connection.end();
  console.log('Seed completado.');
}

seed().catch(console.error);
