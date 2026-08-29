export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      agencies: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          license_number: string | null;
          name: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          license_number?: string | null;
          name: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          license_number?: string | null;
          name?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      building_features: {
        Row: {
          building_id: string;
          created_at: string;
          feature_id: string;
        };
        Insert: {
          building_id: string;
          created_at?: string;
          feature_id: string;
        };
        Update: {
          building_id?: string;
          created_at?: string;
          feature_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "building_features_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "building_features_feature_id_fkey";
            columns: ["feature_id"];
            isOneToOne: false;
            referencedRelation: "features";
            referencedColumns: ["id"];
          },
        ];
      };
      building_stations: {
        Row: {
          building_id: string;
          created_at: string;
          distance_meters: number | null;
          is_primary: boolean;
          station_id: string;
          walk_minutes: number | null;
        };
        Insert: {
          building_id: string;
          created_at?: string;
          distance_meters?: number | null;
          is_primary?: boolean;
          station_id: string;
          walk_minutes?: number | null;
        };
        Update: {
          building_id?: string;
          created_at?: string;
          distance_meters?: number | null;
          is_primary?: boolean;
          station_id?: string;
          walk_minutes?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "building_stations_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "building_stations_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "stations";
            referencedColumns: ["id"];
          },
        ];
      };
      buildings: {
        Row: {
          address: string;
          building_type: string;
          built_month: number | null;
          built_year: number | null;
          city: string | null;
          created_at: string;
          floors_above: number | null;
          floors_below: number | null;
          id: string;
          land_rights: string | null;
          latitude: number | null;
          longitude: number | null;
          name: string;
          name_normalized: string | null;
          normalized_address: string | null;
          prefecture: string | null;
          structure: string | null;
          total_units: number | null;
          updated_at: string;
          use_zone: string | null;
        };
        Insert: {
          address: string;
          building_type?: string;
          built_month?: number | null;
          built_year?: number | null;
          city?: string | null;
          created_at?: string;
          floors_above?: number | null;
          floors_below?: number | null;
          id?: string;
          land_rights?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          name_normalized?: string | null;
          normalized_address?: string | null;
          prefecture?: string | null;
          structure?: string | null;
          total_units?: number | null;
          updated_at?: string;
          use_zone?: string | null;
        };
        Update: {
          address?: string;
          building_type?: string;
          built_month?: number | null;
          built_year?: number | null;
          city?: string | null;
          created_at?: string;
          floors_above?: number | null;
          floors_below?: number | null;
          id?: string;
          land_rights?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          name_normalized?: string | null;
          normalized_address?: string | null;
          prefecture?: string | null;
          structure?: string | null;
          total_units?: number | null;
          updated_at?: string;
          use_zone?: string | null;
        };
        Relationships: [];
      };
      features: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          scope: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          scope: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          scope?: string;
        };
        Relationships: [];
      };
      listing_images: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          image_type: string | null;
          listing_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_type?: string | null;
          listing_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_type?: string | null;
          listing_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      listings: {
        Row: {
          agency_id: string | null;
          created_at: string;
          current_price_yen: number | null;
          current_status: string;
          first_listed_at: string | null;
          handover_date: string | null;
          handover_note: string | null;
          id: string;
          last_confirmed_at: string | null;
          management_fee_yen: number | null;
          occupancy_status: string | null;
          repair_reserve_fund_yen: number | null;
          transaction_type: string | null;
          unit_id: string;
          updated_at: string;
        };
        Insert: {
          agency_id?: string | null;
          created_at?: string;
          current_price_yen?: number | null;
          current_status?: string;
          first_listed_at?: string | null;
          handover_date?: string | null;
          handover_note?: string | null;
          id?: string;
          last_confirmed_at?: string | null;
          management_fee_yen?: number | null;
          occupancy_status?: string | null;
          repair_reserve_fund_yen?: number | null;
          transaction_type?: string | null;
          unit_id: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string | null;
          created_at?: string;
          current_price_yen?: number | null;
          current_status?: string;
          first_listed_at?: string | null;
          handover_date?: string | null;
          handover_note?: string | null;
          id?: string;
          last_confirmed_at?: string | null;
          management_fee_yen?: number | null;
          occupancy_status?: string | null;
          repair_reserve_fund_yen?: number | null;
          transaction_type?: string | null;
          unit_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      price_history: {
        Row: {
          created_at: string;
          effective_at: string;
          id: string;
          listing_id: string;
          note: string | null;
          price_yen: number;
          source_id: string | null;
        };
        Insert: {
          created_at?: string;
          effective_at?: string;
          id?: string;
          listing_id: string;
          note?: string | null;
          price_yen: number;
          source_id?: string | null;
        };
        Update: {
          created_at?: string;
          effective_at?: string;
          id?: string;
          listing_id?: string;
          note?: string | null;
          price_yen?: number;
          source_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "price_history_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_history_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      raw_listings: {
        Row: {
          created_at: string;
          id: string;
          match_confidence: number | null;
          match_status: string;
          matched_at: string | null;
          matched_building_id: string | null;
          matched_by: string | null;
          matched_listing_id: string | null;
          matched_unit_id: string | null;
          raw_address: string | null;
          raw_building_name: string | null;
          raw_payload: Json;
          raw_price_yen: number | null;
          scraped_at: string;
          source_id: string;
          source_listing_id: string;
          source_url: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          match_confidence?: number | null;
          match_status?: string;
          matched_at?: string | null;
          matched_building_id?: string | null;
          matched_by?: string | null;
          matched_listing_id?: string | null;
          matched_unit_id?: string | null;
          raw_address?: string | null;
          raw_building_name?: string | null;
          raw_payload?: Json;
          raw_price_yen?: number | null;
          scraped_at?: string;
          source_id: string;
          source_listing_id: string;
          source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          match_confidence?: number | null;
          match_status?: string;
          matched_at?: string | null;
          matched_building_id?: string | null;
          matched_by?: string | null;
          matched_listing_id?: string | null;
          matched_unit_id?: string | null;
          raw_address?: string | null;
          raw_building_name?: string | null;
          raw_payload?: Json;
          raw_price_yen?: number | null;
          scraped_at?: string;
          source_id?: string;
          source_listing_id?: string;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "raw_listings_matched_building_id_fkey";
            columns: ["matched_building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_listings_matched_listing_id_fkey";
            columns: ["matched_listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_listings_matched_unit_id_fkey";
            columns: ["matched_unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_listings_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      research_notes: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          owner_id: string;
          title: string;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          id?: string;
          owner_id?: string;
          title: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          owner_id?: string;
          title?: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "research_notes_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          base_url: string | null;
          code: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          base_url?: string | null;
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          base_url?: string | null;
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stations: {
        Row: {
          company_name: string | null;
          created_at: string;
          id: string;
          line_name: string;
          station_name: string;
        };
        Insert: {
          company_name?: string | null;
          created_at?: string;
          id?: string;
          line_name: string;
          station_name: string;
        };
        Update: {
          company_name?: string | null;
          created_at?: string;
          id?: string;
          line_name?: string;
          station_name?: string;
        };
        Relationships: [];
      };
      status_history: {
        Row: {
          created_at: string;
          effective_at: string;
          id: string;
          listing_id: string;
          note: string | null;
          source_id: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          effective_at?: string;
          id?: string;
          listing_id: string;
          note?: string | null;
          source_id?: string | null;
          status: string;
        };
        Update: {
          created_at?: string;
          effective_at?: string;
          id?: string;
          listing_id?: string;
          note?: string | null;
          source_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "status_history_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "status_history_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      unit_features: {
        Row: {
          created_at: string;
          feature_id: string;
          unit_id: string;
        };
        Insert: {
          created_at?: string;
          feature_id: string;
          unit_id: string;
        };
        Update: {
          created_at?: string;
          feature_id?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unit_features_feature_id_fkey";
            columns: ["feature_id"];
            isOneToOne: false;
            referencedRelation: "features";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "unit_features_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      units: {
        Row: {
          balcony_area_sqm: number | null;
          building_id: string;
          created_at: string;
          direction: string | null;
          floor_area_sqm: number | null;
          floor_number: number | null;
          id: string;
          layout: string | null;
          room_number: string | null;
          updated_at: string;
        };
        Insert: {
          balcony_area_sqm?: number | null;
          building_id: string;
          created_at?: string;
          direction?: string | null;
          floor_area_sqm?: number | null;
          floor_number?: number | null;
          id?: string;
          layout?: string | null;
          room_number?: string | null;
          updated_at?: string;
        };
        Update: {
          balcony_area_sqm?: number | null;
          building_id?: string;
          created_at?: string;
          direction?: string | null;
          floor_area_sqm?: number | null;
          floor_number?: number | null;
          id?: string;
          layout?: string | null;
          room_number?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
