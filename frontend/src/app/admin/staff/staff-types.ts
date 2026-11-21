export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
};

export type Staff = {
  id: number;
  name: string;
  email: string;
  role: "staff";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NewStaffInput = {
  name: string;
  email: string;
  password: string;
};
