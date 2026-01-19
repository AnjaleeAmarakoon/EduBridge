export type UserRole = 'school_admin' | 'donor' | 'volunteer' | 'admin';

export type SchoolType = 'Blind' | 'Deaf' | 'Rural';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: UserRole;
          phone: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: UserRole;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          role?: UserRole;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      schools: {
        Row: {
          school_id: string;
          user_id: string;
          name: string;
          type: SchoolType;
          address: string;
          contact_person: string;
          phone: string | null;
          email: string | null;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          school_id?: string;
          user_id: string;
          name: string;
          type: SchoolType;
          address: string;
          contact_person: string;
          phone?: string | null;
          email?: string | null;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          school_id?: string;
          user_id?: string;
          name?: string;
          type?: SchoolType;
          address?: string;
          contact_person?: string;
          phone?: string | null;
          email?: string | null;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type School = Database['public']['Tables']['schools']['Row'];
