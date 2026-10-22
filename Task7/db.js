require("dotenv").config();
const { DataSource } = require("typeorm");
const user = require("./user");
const Note = require("./note");

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "db75157.databaseasp.net",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER || "db75157",
    password: process.env.DB_PASSWORD || "Se7=@5Zj9m#P",
    database: process.env.DB_NAME || "db75157",
    synchronize: false, // يفضل إيقافها في بيئة الإنتاج واستخدام migrations
    logging: false,
    entities: [user, Note],
    ssl: {
        rejectUnauthorized: false // مطلوب لتجنب أخطاء شهادة SSL عند الاتصال بسيرفر خارجي
    }
});

module.exports = AppDataSource;
