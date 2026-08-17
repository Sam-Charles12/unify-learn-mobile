export type RootStackParamList = {
  Dashboard: undefined;
  CourseList: undefined;
  Course: { courseId: string };
  Week: { courseId: string; weekId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
};