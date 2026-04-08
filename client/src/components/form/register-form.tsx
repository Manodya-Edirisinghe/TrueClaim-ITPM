'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RegisterFormData, faculties, academicYears } from '@/types/register';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    studentId: '',
    universityEmail: '',
    phoneNumber: '',
    faculty: '',
    academicYear: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend logic — UI only
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ─── Personal Details Section ─── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Personal Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-300">
              Full Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              required
            />
          </div>

          {/* Student ID */}
          <div className="space-y-2">
            <Label htmlFor="studentId" className="text-gray-300">
              Student ID / Index Number <span className="text-red-400">*</span>
            </Label>
            <Input
              id="studentId"
              name="studentId"
              placeholder="IT21000000"
              value={formData.studentId}
              onChange={handleChange}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              required
            />
          </div>

          {/* University Email */}
          <div className="space-y-2">
            <Label htmlFor="universityEmail" className="text-gray-300">
              University Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="universityEmail"
              name="universityEmail"
              type="email"
              placeholder="john@university.edu"
              value={formData.universityEmail}
              onChange={handleChange}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-gray-300">
              Phone Number <span className="text-gray-500">(Optional)</span>
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="+94 7X XXX XXXX"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Faculty / Department */}
          <div className="space-y-2">
            <Label htmlFor="faculty" className="text-gray-300">
              Faculty / Department <span className="text-red-400">*</span>
            </Label>
            <select
              id="faculty"
              name="faculty"
              value={formData.faculty}
              onChange={handleChange}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled className="bg-gray-900">
                Select your faculty
              </option>
              {faculties.map((f) => (
                <option key={f} value={f} className="bg-gray-900">
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            <Label htmlFor="academicYear" className="text-gray-300">
              Academic Year / Batch <span className="text-red-400">*</span>
            </Label>
            <select
              id="academicYear"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled className="bg-gray-900">
                Select your year
              </option>
              {academicYears.map((y) => (
                <option key={y} value={y} className="bg-gray-900">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Password Section ─── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Password</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Password <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-300">
              Confirm Password <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Submit Button ─── */}
      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
      >
        Create Account
      </Button>

      {/* ─── Login Link ─── */}
      <p className="text-center text-gray-400 text-sm">
        Already have an account?{' '}
        <a href="/login" className="text-blue-400 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}