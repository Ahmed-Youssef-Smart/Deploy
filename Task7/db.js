require("dotenv").config();
const { DataSource } = require("typeorm");
const { UserSchema } = require("../entities/User");
const { NoteSchema } = require("../entities/Note");

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "db75157.databaseasp.net",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER || "db75157",
    password: process.env.DB_PASSWORD || "Se7=@5Zj9m#P",
    database: process.env.DB_NAME || "db75157",
    synchronize: process.env.NODE_ENV !== "production",
    logging: false,
    entities: [UserSchema, NoteSchema],
    ssl: {
        rejectUnauthorized: false // مطلوب لمعظم الاستضافات السحابية لتخطي فحص الشهادة الذاتية
    }
});

module.exports = AppDataSource;
