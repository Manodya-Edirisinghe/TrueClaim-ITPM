export interface RegisterFormData {
  fullName: string;
  studentId: string;
  universityEmail: string;
  phoneNumber: string;
  faculty: string;
  academicYear: string;
  password: string;
  confirmPassword: string;
}

export const faculties = [
  "Faculty of Engineering",
  "Faculty of Arts",
  "Faculty of Business",
  "Faculty of Science",
  "Faculty of Medicine",
  "Faculty of Law",
  "Faculty of Education",
  "Faculty of IT",
  "Faculty of Architecture",
] as const;

export const academicYears = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
] as const;