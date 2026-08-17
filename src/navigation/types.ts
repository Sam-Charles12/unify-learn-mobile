export type RootStackParamList = {
  Dashboard: undefined;
  CourseList: undefined;
  Course: { courseId: string };
  Week: { courseId: string; weekId: string };
  Notifications: undefined;
  GradePlanner: undefined;
  Profile: undefined;
  Lecturer: { lecturerId: string };
  DashboardTab: undefined;
  CoursesTab: undefined;
  PlannerTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type LecturerNavigatorParamList = {
  LecturerDashboardTab: undefined;
  LecturerCoursesTab: undefined;
  LecturerProfileTab: undefined;
  LecturerDashboard: undefined;
  LecturerCourses: undefined;
  LecturerCourseWorkspace: { courseId: string };
  LecturerProfileEdit: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
};