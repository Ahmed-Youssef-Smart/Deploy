require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const AppDataSource = require("./db");
const User = require("./user"); // استخدام الحرف الكبير لمنع تضارب المتغيرات
const Note = require("./note");
const { hashPassword, comparePasswords } = require("./hash");
const authMiddleware = require("./middleware/auth.middleware");

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

// دالة مساعدة لتسجيل الأخطاء بالتفصيل في الكونسول
function logErrorDetails(req, error) {
    console.error("\n==================== [ ERROR LOG ] ====================");
    console.error(`🕒 الوقت: ${new Date().toISOString()}`);
    console.error(`📍 المسار: [${req.method}] ${req.originalUrl}`);
    console.error(`📦 الـ Body المرسل:`, JSON.stringify(req.body, null, 2));
    console.error(`❌ رسالة الخطأ: ${error.message}`);
    console.error(`🔍 مكان الخطأ بالتفصيل (Stack Trace):\n${error.stack}`);
    console.error("========================================================\n");
}

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

        const userRepository = AppDataSource.getRepository(User);

        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = userRepository.create({
            name,
            email,
            password: hashedPassword,
        });

        const savedUser = await userRepository.save(newUser);
        const { password: _, ...userData } = savedUser;

        res.status(201).json({ message: "User registered successfully", user: userData });
    } catch (error) {
        logErrorDetails(req, error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message,
            endpoint: `${req.method} ${req.originalUrl}` // لتوضيح المسار في الـ response أيضاً
        });
    }
});

// 2. تسجيل الدخول (Login)
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const userRepository = AppDataSource.getRepository(User);
        const foundUser = await userRepository.findOne({ where: { email } });

        if (!foundUser) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await comparePasswords(password, foundUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: foundUser.id, email: foundUser.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const { password: _, ...userData } = foundUser;
        res.json({ message: "Login successful", token, user: userData });
    } catch (error) {
        logErrorDetails(req, error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message,
            endpoint: `${req.method} ${req.originalUrl}`
        });
    }
});

// 3. جلب بيانات المستخدم الحالي (Auth Me)
app.get("/auth/me", authMiddleware, async (req, res) => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const currentUser = await userRepository.findOne({
            where: { id: req.user.userId },
            relations: {
                notes: true
            },
        });

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const { password: _, ...userData } = currentUser;
        res.json(userData);
    } catch (error) {
        logErrorDetails(req, error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message,
            endpoint: `${req.method} ${req.originalUrl}`
        });
    }
});

// 4. مسارات الملاحظات (Notes CRUD)

// إضافة ملاحظة جديدة
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
        logErrorDetails(req, error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message,
            endpoint: `${req.method} ${req.originalUrl}`
        });
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
        logErrorDetails(req, error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message,
            endpoint: `${req.method} ${req.originalUrl}`
        });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
