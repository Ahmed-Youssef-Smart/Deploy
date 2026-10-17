require("dotenv").config();
const { DataSource } = require("typeorm");
const User = require("./user");
const Note = require("./note");

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "notes_db",
    synchronize: true, // يفضل إيقافها في بيئة الإنتاج واستخدام migrations
    logging: false,
    entities: [User, Note],
});

module.exports = AppDataSource;
