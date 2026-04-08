"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";

const faculties = [
  "Faculty of IT",
  "Faculty of Engineering",
  "Faculty of Business",
  "Faculty of Science",
  "Faculty of Arts",
  "Faculty of Medicine",
  "Faculty of Law",
];

const academicYears = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Postgraduate",
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    studentId: "",
    universityEmail: "",
    phoneNumber: "",
    faculty: "",
    academicYear: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await api.post("/auth/register", form);
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: "#1e1e1e",
    border: "1px solid #333",
    color: "#f0f0f0",
  };

  const labelStyle = { color: "#f0f0f0" };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#111111" }}>
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <Link
          href="/landing"
          className="flex items-center justify-center gap-2 text-lg font-semibold mb-8"
          style={{ textDecoration: "none", color: "#f0f0f0" }}
        >
          <div
            className="size-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#0A66C2" }}
          >
            <Sparkles className="size-4 text-white" />
          </div>
          <span>TrueClaim</span>
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{ backgroundColor: "#161616", border: "1px solid #2a2a2a" }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "#ffffff" }}>
              Create your account
            </h1>
            <p className="text-sm" style={{ color: "rgba(240,240,240,0.5)" }}>
              Join TrueClaim and start recovering lost items
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Full Name + Student ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium" style={labelStyle}>
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Manodya Edirisinghe"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className="h-11"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium" style={labelStyle}>
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  name="studentId"
                  type="text"
                  placeholder="IT12345876"
                  value={form.studentId}
                  onChange={handleChange}
                  required
                  className="h-11"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 2: University Email + Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="universityEmail" className="text-sm font-medium" style={labelStyle}>
                  University Email
                </Label>
                <Input
                  id="universityEmail"
                  name="universityEmail"
                  type="email"
                  placeholder="mano@uni.com"
                  value={form.universityEmail}
                  onChange={handleChange}
                  required
                  className="h-11"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium" style={labelStyle}>
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="0749356792"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                  className="h-11"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 3: Faculty + Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty" className="text-sm font-medium" style={labelStyle}>
                  Faculty
                </Label>
                <select
                  id="faculty"
                  name="faculty"
                  value={form.faculty}
                  onChange={handleChange}
                  required
                  className="w-full h-11 rounded-md px-3 text-sm outline-none focus:ring-2 focus:ring-[#0A66C2]"
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="" disabled style={{ backgroundColor: "#1e1e1e" }}>
                    Select faculty
                  </option>
                  {faculties.map((f) => (
                    <option key={f} value={f} style={{ backgroundColor: "#1e1e1e" }}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear" className="text-sm font-medium" style={labelStyle}>
                  Academic Year
                </Label>
                <select
                  id="academicYear"
                  name="academicYear"
                  value={form.academicYear}
                  onChange={handleChange}
                  required
                  className="w-full h-11 rounded-md px-3 text-sm outline-none focus:ring-2 focus:ring-[#0A66C2]"
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="" disabled style={{ backgroundColor: "#1e1e1e" }}>
                    Select year
                  </option>
                  {academicYears.map((y) => (
                    <option key={y} value={y} style={{ backgroundColor: "#1e1e1e" }}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={labelStyle}>
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="h-11 pr-10"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#555555" }}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium mt-2"
              size="lg"
              disabled={isLoading}
              style={{ backgroundColor: "#0A66C2", color: "#ffffff", border: "none" }}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm mt-6" style={{ color: "rgba(240,240,240,0.45)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "#f0f0f0" }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
