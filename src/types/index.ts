export type UserRole = 'student' | 'lecturer' | 'tutor' | 'admin';

export interface User {
  uid: string;
  name: string;
  matric: string;
  email: string;
  department: string;
  level: string;
  role: UserRole;
  createdAt: Date;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  departments: string[];
  levels: string[];
  lecturers: string[];
  tutors: string[];
}

export interface Week {
  id: string;
  weekNumber: number;
  title: string;
  contentBlocks: ContentBlock[];
  isPublished: boolean;
}

export interface ContentBlock {
  type: BlockType;
  data: Record<string, any>;
}

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'definition'
  | 'example'
  | 'image'
  | 'math'
  | 'mcq'
  | 'fitb'
  | 'reveal'
  | 'pulse_check'
  | 'eoq';

export interface Progress {
  completedWeeks: string[];
  quizScores: Record<string, number>;
  lastAccessed: Date;
}

export interface Department {
  id: string;
  name: string;
  faculty: string;
}

export interface Level {
  value: string;
  label: string;
}

export const DEPARTMENTS: Department[] = [
  { id: 'mech', name: 'Mechanical Engineering', faculty: 'Engineering' },
  { id: 'civil', name: 'Civil Engineering', faculty: 'Engineering' },
  { id: 'chem', name: 'Chemical Engineering', faculty: 'Engineering' },
  { id: 'aerospace', name: 'Aerospace Engineering', faculty: 'Engineering' },
  { id: 'industrial', name: 'Industrial Engineering', faculty: 'Engineering' },
];

export const LEVELS: Level[] = [
  { value: '100', label: '100 Level' },
  { value: '200', label: '200 Level' },
  { value: '300', label: '300 Level' },
  { value: '400', label: '400 Level' },
  { value: '500', label: '500 Level' },
];