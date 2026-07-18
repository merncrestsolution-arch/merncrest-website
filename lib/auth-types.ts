export type Role = "CUSTOMER" | "STAFF" | "ADMIN" | "OWNER";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  company: string | null;
  role: Role;
  emailVerifiedAt: Date | null;
};
