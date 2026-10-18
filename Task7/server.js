require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const AppDataSource = require("./db");
const user = require("./user");
const Note = require("./note");
const { hashPassword, comparePasswords } = require("./hash");
const authMiddleware = require("./middleware/auth.middleware");

const app = express();
app.use(express.json());

//const JWT_SECRET = process.env.JWT_SECRET || "in .env file";
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

// تهيئة الاتصال بقاعدة البيانات
AppDataSource.initialize()
    .then(() => {
        console.log("Database connected successfully!");
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });

// 1. تسجيل حساب جديد (Register)
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        const userRepository = AppDataSource.getRepository(user);

        // التحقق من وجود المستخدم مسبقاً
        const existinguser = await userRepository.findOne({ where: { email } });
        if (existinguser) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        // تشفير كلمة المرور
        const hashedPassword = await hashPassword(password);

        const newuser = userRepository.create({
            name,
            email,
            password: hashedPassword,
        });

        const saveduser = await userRepository.save(newuser);

        // لا نعيد كلمة المرور المشفرة في الاستجابة
        const { password: _, ...userData } = saveduser;
        res.status(201).json({ message: "user registered successfully", user: userData });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 2. تسجيل الدخول (Login)
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const userRepository = AppDataSource.getRepository(user);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // إنشاء رمز JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const { password: _, ...userData } = user;
        res.json({ message: "Login successful", token, user: userData });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 3. جلب بيانات المستخدم الحالي (Auth Me)
app.get("/auth/me", authMiddleware, async (req, res) => {
    try {
        const userRepository = AppDataSource.getRepository(user);
        const user = await userRepository.findOne({
            where: { id: req.user.userId },
           // relations: ["notes"], // جلب الملاحظات المرتبطة بالمستخدم
            relations: {
            notes: true
                        },
        });

        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }

        const { password: _, ...userData } = user;
        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 4. مسارات الملاحظات (Notes CRUD)

// إضافة ملاحظة جديدة للمستخدم المسجل
app.post("/notes", authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const noteRepository = AppDataSource.getRepository(Note);
        const newNote = noteRepository.create({
            title,
            content,
            user: { id: req.user.userId },
        });

        const savedNote = await noteRepository.save(newNote);
        res.status(201).json(savedNote);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// جلب جميع ملاحظات المستخدم الحالي
app.get("/notes", authMiddleware, async (req, res) => {
    try {
        const noteRepository = AppDataSource.getRepository(Note);
        const notes = await noteRepository.find({
            where: { user: { id: req.user.userId } },
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
