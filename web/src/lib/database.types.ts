export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          after_json: Json | null;
          before_json: Json | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          family_tree_id: string;
          id: string;
          summary: string;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          after_json?: Json | null;
          before_json?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          family_tree_id: string;
          id?: string;
          summary: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
      };
      family_trees: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["family_trees"]["Insert"]>;
      };
      invites: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          expires_at: string | null;
          family_tree_id: string;
          id: string;
          intended_role: Database["public"]["Enums"]["invite_role"];
          invite_type: Database["public"]["Enums"]["invite_type"];
          token: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          expires_at?: string | null;
          family_tree_id: string;
          id?: string;
          intended_role: Database["public"]["Enums"]["invite_role"];
          invite_type: Database["public"]["Enums"]["invite_type"];
          token: string;
        };
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>;
      };
      memberships: {
        Row: {
          created_at: string;
          family_tree_id: string;
          id: string;
          person_id: string | null;
          role: Database["public"]["Enums"]["tree_role"];
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          family_tree_id: string;
          id?: string;
          person_id?: string | null;
          role: Database["public"]["Enums"]["tree_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Insert"]>;
      };
      people: {
        Row: {
          alternative_names_json: Json | null;
          bio: string | null;
          birth_date: string | null;
          birth_place: string | null;
          created_at: string;
          created_by_user_id: string | null;
          current_place: string | null;
          death_date: string | null;
          family_tree_id: string;
          gender: string | null;
          generation_index: number | null;
          id: string;
          is_living: boolean;
          photo_url: string | null;
          primary_name: string;
          updated_at: string;
        };
        Insert: {
          alternative_names_json?: Json | null;
          bio?: string | null;
          birth_date?: string | null;
          birth_place?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          current_place?: string | null;
          death_date?: string | null;
          family_tree_id: string;
          gender?: string | null;
          generation_index?: number | null;
          id?: string;
          is_living?: boolean;
          photo_url?: string | null;
          primary_name: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["people"]["Insert"]>;
      };
      person_title_overrides: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          explanation_text: string | null;
          family_tree_id: string;
          id: string;
          locale: string;
          target_person_id: string;
          title_text: string;
          viewer_person_id: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          explanation_text?: string | null;
          family_tree_id: string;
          id?: string;
          locale?: string;
          target_person_id: string;
          title_text: string;
          viewer_person_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["person_title_overrides"]["Insert"]
        >;
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          preferred_language: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          preferred_language?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      relationships: {
        Row: {
          created_at: string;
          created_by_user_id: string | null;
          end_date: string | null;
          family_tree_id: string;
          from_person_id: string;
          id: string;
          metadata_json: Json | null;
          relationship_type: Database["public"]["Enums"]["relationship_type"];
          start_date: string | null;
          status: Database["public"]["Enums"]["relationship_status"];
          to_person_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id?: string | null;
          end_date?: string | null;
          family_tree_id: string;
          from_person_id: string;
          id?: string;
          metadata_json?: Json | null;
          relationship_type: Database["public"]["Enums"]["relationship_type"];
          start_date?: string | null;
          status?: Database["public"]["Enums"]["relationship_status"];
          to_person_id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["relationships"]["Insert"]>;
      };
      suggested_edits: {
        Row: {
          action_type: string;
          created_at: string;
          family_tree_id: string;
          id: string;
          proposed_by_user_id: string;
          proposed_change_json: Json;
          reviewed_at: string | null;
          reviewed_by_user_id: string | null;
          review_notes: string | null;
          status: Database["public"]["Enums"]["suggested_edit_status"];
          target_entity_id: string | null;
          target_entity_type: string;
        };
        Insert: {
          action_type: string;
          created_at?: string;
          family_tree_id: string;
          id?: string;
          proposed_by_user_id: string;
          proposed_change_json: Json;
          reviewed_at?: string | null;
          reviewed_by_user_id?: string | null;
          review_notes?: string | null;
          status?: Database["public"]["Enums"]["suggested_edit_status"];
          target_entity_id?: string | null;
          target_entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["suggested_edits"]["Insert"]>;
      };
    };
    Enums: {
      invite_role: "guest" | "contributor" | "editor";
      invite_type: "guest" | "member";
      membership_status: "active" | "invited" | "disabled";
      relationship_status: "active" | "divorced" | "separated" | "inactive";
      relationship_type:
        | "biological_parent"
        | "adoptive_parent"
        | "step_parent"
        | "guardian"
        | "spouse";
      suggested_edit_status: "pending" | "approved" | "rejected";
      tree_role: "contributor" | "editor" | "admin";
    };
  };
};
