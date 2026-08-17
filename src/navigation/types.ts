export type RootStackParamList = {
  Dashboard: undefined;
  CourseList: undefined;
  Course: { courseId: string };
  Week: { courseId: string; weekId: string };
  Notifications: undefined;
  GradePlanner: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
};