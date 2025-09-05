import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};


const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


const initDatabase = async () => {
  try {
   
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });


    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();


    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user (
      user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      type_id INT REFERENCES Type(type_id),
      isActive BOOLEAN NOT NULL DEFAULT 1,
      created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
    `);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Type (
      type_id INT AUTO_INCREMENT PRIMARY KEY,
      type_name VARCHAR(255) NOT NULL,
      type_description VARCHAR(255)
      )
    `);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Store (
      store_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL REFERENCES user(user_id),
      store_name VARCHAR(255) NOT NULL,
      store_location VARCHAR(255),
      created_by INT NOT NULL,
      created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      isActive BOOLEAN NOT NULL DEFAULT TRUE)
    `);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Item (
      item_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      item_description VARCHAR(255) DEFAULT NULL,
      category_id INT REFERENCES Category(category_id),
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      created_by INT NOT NULL REFERENCES user(user_id),
      created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
    `);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Category (
      category_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      category_name VARCHAR(255) NOT NULL,
      category_description VARCHAR(255))
    `)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Required_Qty (
      required_qty_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      item_id INT NOT NULL REFERENCES Item(item_id),
      shop_id INT NOT NULL REFERENCES user(user_id),
      quantity INT NOT NULL,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
    `)

    console.log('Database and table initialized successfully');
  } 
  catch (error) {
    console.error('Database initialization error:', error);
  }
};

initDatabase();

export default pool;