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
      acquisitions: {
        Row: {
          acquisition_cap_rate: number | null;
          acquisition_date: string;
          acquisition_price_yen: number | null;
          created_at: string;
          id: string;
          note: string | null;
          ownership_ratio: number;
          property_id: string;
          reit_id: string;
          seller: string | null;
          source_id: string | null;
        };
        Insert: {
          acquisition_cap_rate?: number | null;
          acquisition_date: string;
          acquisition_price_yen?: number | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          ownership_ratio?: number;
          property_id: string;
          reit_id: string;
          seller?: string | null;
          source_id?: string | null;
        };
        Update: {
          acquisition_cap_rate?: number | null;
          acquisition_date?: string;
          acquisition_price_yen?: number | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          ownership_ratio?: number;
          property_id?: string;
          reit_id?: string;
          seller?: string | null;
          source_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "acquisitions_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "acquisitions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "acquisitions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "acquisitions_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      dispositions: {
        Row: {
          buyer: string | null;
          created_at: string;
          disposition_date: string;
          disposition_price_yen: number | null;
          gain_loss_yen: number | null;
          id: string;
          note: string | null;
          ownership_ratio: number;
          property_id: string;
          reit_id: string;
          source_id: string | null;
        };
        Insert: {
          buyer?: string | null;
          created_at?: string;
          disposition_date: string;
          disposition_price_yen?: number | null;
          gain_loss_yen?: number | null;
          id?: string;
          note?: string | null;
          ownership_ratio?: number;
          property_id: string;
          reit_id: string;
          source_id?: string | null;
        };
        Update: {
          buyer?: string | null;
          created_at?: string;
          disposition_date?: string;
          disposition_price_yen?: number | null;
          gain_loss_yen?: number | null;
          id?: string;
          note?: string | null;
          ownership_ratio?: number;
          property_id?: string;
          reit_id?: string;
          source_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dispositions_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dispositions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "dispositions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dispositions_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      portfolio_transactions: {
        Row: {
          created_at: string;
          id: string;
          memo: string | null;
          owner_id: string;
          price_per_unit_yen: number;
          quantity_units: number;
          reit_id: string;
          source: string;
          transaction_date: string;
          transaction_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          memo?: string | null;
          owner_id?: string;
          price_per_unit_yen: number;
          quantity_units: number;
          reit_id: string;
          source?: string;
          transaction_date: string;
          transaction_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          memo?: string | null;
          owner_id?: string;
          price_per_unit_yen?: number;
          quantity_units?: number;
          reit_id?: string;
          source?: string;
          transaction_date?: string;
          transaction_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_transactions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "portfolio_transactions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
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
      properties: {
        Row: {
          address: string;
          built_year: number | null;
          created_at: string;
          id: string;
          name: string;
          prefecture: string | null;
          region_id: string | null;
          total_floor_area_sqm: number | null;
          updated_at: string;
          use_type: string;
        };
        Insert: {
          address: string;
          built_year?: number | null;
          created_at?: string;
          id?: string;
          name: string;
          prefecture?: string | null;
          region_id?: string | null;
          total_floor_area_sqm?: number | null;
          updated_at?: string;
          use_type: string;
        };
        Update: {
          address?: string;
          built_year?: number | null;
          created_at?: string;
          id?: string;
          name?: string;
          prefecture?: string | null;
          region_id?: string | null;
          total_floor_area_sqm?: number | null;
          updated_at?: string;
          use_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "regions";
            referencedColumns: ["id"];
          },
        ];
      };
      raw_transactions: {
        Row: {
          created_at: string;
          id: string;
          match_confidence: number | null;
          match_status: string;
          matched_acquisition_id: string | null;
          matched_at: string | null;
          matched_by: string | null;
          matched_disposition_id: string | null;
          matched_property_id: string | null;
          matched_reit_id: string | null;
          raw_address: string | null;
          raw_cap_rate: number | null;
          raw_date: string | null;
          raw_gain_loss_yen: number | null;
          raw_payload: Json;
          raw_price_yen: number | null;
          raw_property_name: string | null;
          raw_reit_name: string | null;
          raw_use_type: string | null;
          scraped_at: string;
          source_id: string;
          source_record_id: string | null;
          source_url: string | null;
          transaction_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          match_confidence?: number | null;
          match_status?: string;
          matched_acquisition_id?: string | null;
          matched_at?: string | null;
          matched_by?: string | null;
          matched_disposition_id?: string | null;
          matched_property_id?: string | null;
          matched_reit_id?: string | null;
          raw_address?: string | null;
          raw_cap_rate?: number | null;
          raw_date?: string | null;
          raw_gain_loss_yen?: number | null;
          raw_payload?: Json;
          raw_price_yen?: number | null;
          raw_property_name?: string | null;
          raw_reit_name?: string | null;
          raw_use_type?: string | null;
          scraped_at?: string;
          source_id: string;
          source_record_id?: string | null;
          source_url?: string | null;
          transaction_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          match_confidence?: number | null;
          match_status?: string;
          matched_acquisition_id?: string | null;
          matched_at?: string | null;
          matched_by?: string | null;
          matched_disposition_id?: string | null;
          matched_property_id?: string | null;
          matched_reit_id?: string | null;
          raw_address?: string | null;
          raw_cap_rate?: number | null;
          raw_date?: string | null;
          raw_gain_loss_yen?: number | null;
          raw_payload?: Json;
          raw_price_yen?: number | null;
          raw_property_name?: string | null;
          raw_reit_name?: string | null;
          raw_use_type?: string | null;
          scraped_at?: string;
          source_id?: string;
          source_record_id?: string | null;
          source_url?: string | null;
          transaction_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "raw_transactions_matched_acquisition_id_fkey";
            columns: ["matched_acquisition_id"];
            isOneToOne: false;
            referencedRelation: "acquisitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_transactions_matched_disposition_id_fkey";
            columns: ["matched_disposition_id"];
            isOneToOne: false;
            referencedRelation: "dispositions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_transactions_matched_property_id_fkey";
            columns: ["matched_property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_transactions_matched_reit_id_fkey";
            columns: ["matched_reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "raw_transactions_matched_reit_id_fkey";
            columns: ["matched_reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_transactions_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      regions: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      reit_distributions: {
        Row: {
          created_at: string;
          distribution_per_unit_yen: number;
          fiscal_period_end: string;
          id: string;
          is_forecast: boolean;
          reit_id: string;
          source_id: string | null;
        };
        Insert: {
          created_at?: string;
          distribution_per_unit_yen: number;
          fiscal_period_end: string;
          id?: string;
          is_forecast?: boolean;
          reit_id: string;
          source_id?: string | null;
        };
        Update: {
          created_at?: string;
          distribution_per_unit_yen?: number;
          fiscal_period_end?: string;
          id?: string;
          is_forecast?: boolean;
          reit_id?: string;
          source_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reit_distributions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "reit_distributions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reit_distributions_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      reit_market_snapshots: {
        Row: {
          created_at: string;
          distribution_yield_pct: number | null;
          id: string;
          market_cap_yen: number | null;
          nav_multiple: number | null;
          nav_per_unit_yen: number | null;
          reit_id: string;
          snapshot_date: string;
          source_id: string | null;
          trading_volume_units: number | null;
          unit_price_change_pct: number | null;
          unit_price_change_yen: number | null;
          unit_price_yen: number | null;
        };
        Insert: {
          created_at?: string;
          distribution_yield_pct?: number | null;
          id?: string;
          market_cap_yen?: number | null;
          nav_multiple?: number | null;
          nav_per_unit_yen?: number | null;
          reit_id: string;
          snapshot_date: string;
          source_id?: string | null;
          trading_volume_units?: number | null;
          unit_price_change_pct?: number | null;
          unit_price_change_yen?: number | null;
          unit_price_yen?: number | null;
        };
        Update: {
          created_at?: string;
          distribution_yield_pct?: number | null;
          id?: string;
          market_cap_yen?: number | null;
          nav_multiple?: number | null;
          nav_per_unit_yen?: number | null;
          reit_id?: string;
          snapshot_date?: string;
          source_id?: string | null;
          trading_volume_units?: number | null;
          unit_price_change_pct?: number | null;
          unit_price_change_yen?: number | null;
          unit_price_yen?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "reit_market_snapshots_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "reit_market_snapshots_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reit_market_snapshots_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      reit_portfolio_metrics: {
        Row: {
          annual_distribution_yen: number | null;
          asset_size_yen: number | null;
          average_building_age_years: number | null;
          created_at: string;
          fiscal_period_end: string;
          id: string;
          interest_bearing_debt_ratio_pct: number | null;
          noi_yield_pct: number | null;
          property_count: number | null;
          reit_id: string;
          roe_pct: number | null;
          source_id: string | null;
          unrealized_gain_loss_pct: number | null;
        };
        Insert: {
          annual_distribution_yen?: number | null;
          asset_size_yen?: number | null;
          average_building_age_years?: number | null;
          created_at?: string;
          fiscal_period_end: string;
          id?: string;
          interest_bearing_debt_ratio_pct?: number | null;
          noi_yield_pct?: number | null;
          property_count?: number | null;
          reit_id: string;
          roe_pct?: number | null;
          source_id?: string | null;
          unrealized_gain_loss_pct?: number | null;
        };
        Update: {
          annual_distribution_yen?: number | null;
          asset_size_yen?: number | null;
          average_building_age_years?: number | null;
          created_at?: string;
          fiscal_period_end?: string;
          id?: string;
          interest_bearing_debt_ratio_pct?: number | null;
          noi_yield_pct?: number | null;
          property_count?: number | null;
          reit_id?: string;
          roe_pct?: number | null;
          source_id?: string | null;
          unrealized_gain_loss_pct?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "reit_portfolio_metrics_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "reit_portfolio_metrics_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reit_portfolio_metrics_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      reits: {
        Row: {
          asset_manager: string | null;
          created_at: string;
          fiscal_month: number | null;
          id: string;
          listed_at: string | null;
          name: string;
          primary_use_type: string | null;
          securities_code: string;
          sponsor: string | null;
          updated_at: string;
        };
        Insert: {
          asset_manager?: string | null;
          created_at?: string;
          fiscal_month?: number | null;
          id?: string;
          listed_at?: string | null;
          name: string;
          primary_use_type?: string | null;
          securities_code: string;
          sponsor?: string | null;
          updated_at?: string;
        };
        Update: {
          asset_manager?: string | null;
          created_at?: string;
          fiscal_month?: number | null;
          id?: string;
          listed_at?: string | null;
          name?: string;
          primary_use_type?: string | null;
          securities_code?: string;
          sponsor?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
    };
    Views: {
      my_reit_holdings: {
        Row: {
          average_acquisition_price_yen: number | null;
          first_acquired_at: string | null;
          last_transaction_date: string | null;
          net_quantity_units: number | null;
          owner_id: string | null;
          reit_id: string | null;
          reit_name: string | null;
          securities_code: string | null;
          status: string | null;
          total_bought_quantity_units: number | null;
          total_sold_quantity_units: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_transactions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "portfolio_transactions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
            referencedColumns: ["id"];
          },
        ];
      };
      property_holdings: {
        Row: {
          net_ownership_ratio: number | null;
          property_id: string | null;
          reit_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "acquisitions_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "acquisitions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reit_rankings";
            referencedColumns: ["reit_id"];
          },
          {
            foreignKeyName: "acquisitions_reit_id_fkey";
            columns: ["reit_id"];
            isOneToOne: false;
            referencedRelation: "reits";
            referencedColumns: ["id"];
          },
        ];
      };
      reit_rankings: {
        Row: {
          annual_distribution_yen: number | null;
          asset_size_yen: number | null;
          average_building_age_years: number | null;
          distribution_yield_pct: number | null;
          fiscal_period_end: string | null;
          interest_bearing_debt_ratio_pct: number | null;
          market_cap_yen: number | null;
          name: string | null;
          nav_multiple: number | null;
          nav_per_unit_yen: number | null;
          noi_yield_pct: number | null;
          primary_use_type: string | null;
          property_count: number | null;
          reit_id: string | null;
          roe_pct: number | null;
          securities_code: string | null;
          snapshot_date: string | null;
          trading_volume_units: number | null;
          unit_price_change_pct: number | null;
          unit_price_yen: number | null;
          unrealized_gain_loss_pct: number | null;
        };
        Relationships: [];
      };
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
