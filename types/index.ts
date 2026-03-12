// TypeScript interfaces matching backend API contract

// Multilanguage text object
export interface MultilangText {
  uz: string;
  ru: string;
  en: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_pages?: number;
  total_items: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;          // total number of items
  page: number;           // current page
  limit: number;          // items per page
  total_page: number;     // total pages
  has_previous: boolean;  // has previous page
  has_next: boolean;      // has next page
  meta?: PaginationMeta;  // pagination metadata (optional because not all responses include it)
}

// Common Fields
type ID = string;
type DateString = string; // ISO 8601

// ─── AUTHENTICATION ─────────────────────
export interface LoginReq {
  login: string;
  password: string;
}

export interface TokenRes {
  access_token: string;
  refresh_token: string;
  id: string;
  role: string;
}

export interface AuthResponse extends TokenRes {
  // Keeping interface consistent with TokenRes
}

export interface PasswordChangeReq {
  old_password?: string;
  new_password?: string;
}

// ─── ABOUT ──────────────────────────────
export interface About {
  id: ID;
  title: MultilangText;
  description: MultilangText;
  order_num: number;
  link_url?: string;
  created_at: DateString;
  updated_at: DateString;
}

export type AboutCreateBody = Omit<About, 'id' | 'created_at' | 'updated_at'>;
export type AboutUpdateBody = Partial<AboutCreateBody>;

// ─── CONTACT ────────────────────────────
export interface Contact {
  id: ID;
  name: string;
  phone_number: string;
  link_url?: string;
  created_at: DateString;
  updated_at: DateString;
}

export interface ContactCreateBody {
  name: string;
  phone_number: string;
  link_url?: string;
}
export type ContactUpdateBody = Partial<ContactCreateBody>;

// ─── FAQ ────────────────────────────────
export interface FAQ {
  id: ID;
  question: MultilangText;
  answer: MultilangText;
  order_num: number;
  created_at: DateString;
  updated_at: DateString;
}

export type FAQCreateBody = Omit<FAQ, 'id' | 'created_at' | 'updated_at'>;
export type FAQUpdateBody = Partial<FAQCreateBody>;

// ─── BANNER ─────────────────────────────
export interface Banner {
  id: ID;
  title: MultilangText;
  description: MultilangText;
  image_url: MultilangText; // Image URL is now multilingual
  link_url?: string;
  order_num: number;
  created_at: DateString;
  updated_at: DateString;
}

export type BannerCreateBody = Omit<Banner, 'id' | 'created_at' | 'updated_at'>;
export type BannerUpdateBody = Partial<BannerCreateBody>;

// ─── SUBJECT ─────────────────────────────
export interface Subject {
  id: ID;
  name: MultilangText;
  image_url: string; // Icon or image
  order_num: number;
  created_at: DateString;
  updated_at: DateString;
}

export type SubjectCreateBody = Omit<Subject, 'id' | 'created_at' | 'updated_at'>;
export type SubjectUpdateBody = Partial<SubjectCreateBody>;

// ─── TEACHER ─────────────────────────────
export interface Teacher {
  id: ID;
  name: string;
  login: string;
  phone_number: string;
  role: 'teacher';
  created_at: DateString;
  updated_at: DateString;
}

export interface TeacherCreateBody extends Omit<Teacher, 'id' | 'created_at' | 'updated_at' | 'role'> {
  password?: string;
}
export type TeacherUpdateBody = Partial<TeacherCreateBody>;

// ─── SOURCE ──────────────────────────────
export interface Source {
  id: ID;
  lesson_id: ID;
  name: MultilangText;
  url: MultilangText; // Multilingual URL
  type: 'video' | 'document' | 'test'; // Strict enums
  order_num: number;
  created_at: DateString;
  updated_at: DateString;
}

export type SourceCreateBody = Omit<Source, 'id' | 'created_at' | 'updated_at'>;
export type SourceUpdateBody = Partial<SourceCreateBody>;

// ─── COURSE ──────────────────────────────
export interface CoursePriceOption {
  duration: number; // in MONTHS
  price: number;
  tariff_id?: ID;
}

export interface Course {
  id: ID;
  name: MultilangText;
  description: MultilangText;
  price: CoursePriceOption[];
  old_price?: number;
  image_url: string;
  subject_id: ID; // Link to Subject
  teacher_id?: ID; // Link to Teacher
  order_num: number;
  is_public: boolean;
  is_active: boolean;
  can_buy: boolean;
  created_at: DateString;
  updated_at: DateString;
}

export type CourseCreateBody = Omit<Course, 'id' | 'created_at' | 'updated_at'>;
export type CourseUpdateBody = Omit<Partial<CourseCreateBody>, 'price'> & {
  price?: CoursePriceOption[] | null;
};

// User-Course Relationship (updated to match Swagger)
export interface CoursePermission {
  id: ID;
  user_id: ID;
  course_id: ID;
  tariff_id: ID; // Links to Tariff
  started_at: DateString;
  ended_at: DateString;
  is_active: boolean;
  duration: number; // in months
  course?: Course;
  tariff?: Tariff;
  created_at: DateString;
  updated_at: DateString;
}

export interface CoursePermissionCreateBody {
  user_id: ID;
  course_id: ID;
  tariff_id: ID;
  started_at?: string;
  ended_at?: string;
}

// ─── MODULE ──────────────────────────────
export interface Module {
  id: ID;
  course_id: ID;
  name: MultilangText;
  description?: MultilangText;
  order_num: number;
  created_at: DateString;
  updated_at: DateString;
}

export type ModuleCreateBody = Omit<Module, 'id' | 'created_at' | 'updated_at'>;
export type ModuleUpdateBody = Partial<ModuleCreateBody>;

// ─── LESSON ──────────────────────────────
export interface Lesson {
  id: ID;
  module_id: ID;
  name: MultilangText;
  type: 'lesson' | 'test';
  duration?: number; // seconds
  order_num: number;
  is_free: boolean; // Preview allowed?
  is_public: boolean; // Public visibility
  created_at: DateString;
  updated_at: DateString;
}

export type LessonCreateBody = Omit<Lesson, 'id' | 'created_at' | 'updated_at'>;
export type LessonUpdateBody = Partial<LessonCreateBody>;

// ─── USER (ADMIN VIEW) ───────────────────
export interface User {
  id: ID;
  name: string;
  phone_number: string;
  role: 'user' | 'admin' | 'moderator';
  is_blocked: boolean;
  created_at: DateString;
  updated_at: DateString;
}

export interface UserProfile extends User {
  // Extra profile fields
  birth_date?: string;
  gender?: 'male' | 'female';
  address?: string;
}

export interface UserActivity {
  id: ID;
  user_id: ID;
  action: string;
  metadata?: any;
  created_at: DateString;
}

// ─── NOTIFICATION ────────────────────────
// FIXED: Changed type to 'all' | 'selected' as per user requirement
export interface Notification {
  id: ID;
  course_id?: ID;
  title: MultilangText;
  message: MultilangText;
  type: 'all' | 'selected';
  is_sent: boolean;
  sent_at?: DateString;
  created_at: DateString;
}

export type NotificationCreateBody = Omit<Notification, 'id' | 'created_at' | 'is_sent' | 'sent_at'>;
export type NotificationUpdateBody = Partial<NotificationCreateBody>;

// ─── FILE UPDATE ─────────────────────────
export interface FileUploadRes {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

// ─── APP CONFIG (formerly App Route) ─────
export interface AppVersion {
  android: string;
  ios: string;
}

export interface AppLinks {
  google: string;
  apple: string;
}

export interface AppConfig {
  id: string;
  call_center: string;
  support_url: string;
  app_version: AppVersion;
  app_links: AppLinks;
  payment_min_version: string;
  buy_course: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppConfigList {
  app_routes: AppConfig[];
  count: number;
}

export type AppConfigUpdateBody = Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>;


// ─── TARIFF ──────────────────────────────
export interface Tariff {
  id: ID;
  name: string; // Backend expects string, not MultilangText
  description: string; // Backend expects string, not MultilangText
  duration: number; // in MONTHS (not days)
  order_num: number;
  created_at: DateString;
  updated_at: DateString;
}

export interface TariffCreateBody {
  name: string;
  description: string;
  duration: number;
  order_num?: number;
}

export type TariffUpdateBody = Partial<TariffCreateBody>;

// ─── PROMOCODE ───────────────────────────
export interface PromocodeRedemption {
  id: string;
  promocode_id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  course_id?: string;
  course_name?: string;
  amount: number;
  discount_amount: number;
  used_at: string;
  status?: string;
  created_at: string;
}

export interface PromocodeRedemptionListResponse extends PaginatedResponse<PromocodeRedemption> { }

// ─── DASHBOARD ───────────────────────────
export interface DashboardRes {
  tariffs: number;
  subjects: number;
  courses: number;
  modules: number;
  lessons: number;
  tests: number;
  documents: number;
  videos: number;
  users: number;
  active_users: number;
  teachers: number;
}

export interface GetDashboardReq {
  type: 'range' | 'day' | 'week' | 'month' | 'year' | 'all';
  day?: string; // YYYY-MM-DD
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}
