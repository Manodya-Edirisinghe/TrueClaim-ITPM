import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "./config/loadEnv";
import User from "./models/User"; // ⚠️ adjust path if needed

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    // Check if admin already exists (prevents duplicates)
    const existingAdmin = await User.findOne({
      universityEmail: "admin@trueclaim.com",
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = new User({
      fullName: "Admin User",
      studentId: "ADMIN001",
      universityEmail: "admin@trueclaim.com",
      faculty: "Admin",
      academicYear: "N/A",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();

    console.log("✅ Admin created successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();