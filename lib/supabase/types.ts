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
      article_analyses: {
        Row: {
          article_id: string;
          bias_label: "left" | "center" | "right" | "mixed" | "unclear";
          bias_score: number;
          center_percentage: number;
          confidence: number;
          created_at: string;
          disclaimer: string;
          framing_notes: string;
          id: string;
          left_percentage: number;
          loaded_terms: string[];
          model: string;
          right_percentage: number;
          sentiment_label: "positive" | "neutral" | "negative";
          sentiment_score: number;
          summary: string;
          updated_at: string;
        };
        Insert: {
          article_id: string;
          bias_label: "left" | "center" | "right" | "mixed" | "unclear";
          bias_score: number;
          center_percentage: number;
          confidence: number;
          created_at?: string;
          disclaimer: string;
          framing_notes: string;
          id?: string;
          left_percentage: number;
          loaded_terms?: string[];
          model: string;
          right_percentage: number;
          sentiment_label: "positive" | "neutral" | "negative";
          sentiment_score: number;
          summary: string;
          updated_at?: string;
        };
        Update: {
          article_id?: string;
          bias_label?: "left" | "center" | "right" | "mixed" | "unclear";
          bias_score?: number;
          center_percentage?: number;
          confidence?: number;
          created_at?: string;
          disclaimer?: string;
          framing_notes?: string;
          id?: string;
          left_percentage?: number;
          loaded_terms?: string[];
          model?: string;
          right_percentage?: number;
          sentiment_label?: "positive" | "neutral" | "negative";
          sentiment_score?: number;
          summary?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_analyses_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: true;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          analyzed_at: string | null;
          canonical_url: string | null;
          created_at: string;
          id: string;
          image_url: string;
          original_url: string;
          published_at: string;
          raw_text: string;
          scraped_at: string;
          source_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          analyzed_at?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          original_url: string;
          published_at: string;
          raw_text: string;
          scraped_at?: string;
          source_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          analyzed_at?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          original_url?: string;
          published_at?: string;
          raw_text?: string;
          scraped_at?: string;
          source_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      logs: {
        Row: {
          article_id: string | null;
          context: Json;
          created_at: string;
          event: string;
          id: string;
          level: "debug" | "info" | "warn" | "error";
          message: string;
          schedule_id: string | null;
          schedule_run_id: string | null;
          source_id: string | null;
        };
        Insert: {
          article_id?: string | null;
          context?: Json;
          created_at?: string;
          event: string;
          id?: string;
          level: "debug" | "info" | "warn" | "error";
          message: string;
          schedule_id?: string | null;
          schedule_run_id?: string | null;
          source_id?: string | null;
        };
        Update: {
          article_id?: string | null;
          context?: Json;
          created_at?: string;
          event?: string;
          id?: string;
          level?: "debug" | "info" | "warn" | "error";
          message?: string;
          schedule_id?: string | null;
          schedule_run_id?: string | null;
          source_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "logs_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logs_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "oxylabs_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logs_schedule_run_id_fkey";
            columns: ["schedule_run_id"];
            isOneToOne: false;
            referencedRelation: "oxylabs_schedule_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      oxylabs_schedule_runs: {
        Row: {
          created_at: string;
          error: Json | null;
          external_job_id: string | null;
          external_run_id: string | null;
          id: string;
          oxylabs_schedule_id: string;
          processed_at: string | null;
          result_status: "pending" | "done" | "faulted" | null;
          started_at: string | null;
          status: "discovered" | "processing" | "completed" | "failed" | "skipped";
          summary: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error?: Json | null;
          external_job_id?: string | null;
          external_run_id?: string | null;
          id?: string;
          oxylabs_schedule_id: string;
          processed_at?: string | null;
          result_status?: "pending" | "done" | "faulted" | null;
          started_at?: string | null;
          status?: "discovered" | "processing" | "completed" | "failed" | "skipped";
          summary?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error?: Json | null;
          external_job_id?: string | null;
          external_run_id?: string | null;
          id?: string;
          oxylabs_schedule_id?: string;
          processed_at?: string | null;
          result_status?: "pending" | "done" | "faulted" | null;
          started_at?: string | null;
          status?: "discovered" | "processing" | "completed" | "failed" | "skipped";
          summary?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oxylabs_schedule_runs_oxylabs_schedule_id_fkey";
            columns: ["oxylabs_schedule_id"];
            isOneToOne: false;
            referencedRelation: "oxylabs_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      oxylabs_schedules: {
        Row: {
          created_at: string;
          cron_expression: string | null;
          id: string;
          last_synced_at: string | null;
          request_payload: Json;
          schedule_id: string;
          source_id: string;
          status: "active" | "inactive" | "pending" | "failed";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          cron_expression?: string | null;
          id?: string;
          last_synced_at?: string | null;
          request_payload?: Json;
          schedule_id: string;
          source_id: string;
          status?: "active" | "inactive" | "pending" | "failed";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          cron_expression?: string | null;
          id?: string;
          last_synced_at?: string | null;
          request_payload?: Json;
          schedule_id?: string;
          source_id?: string;
          status?: "active" | "inactive" | "pending" | "failed";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oxylabs_schedules_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: true;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          listing_url: string;
          logo_url: string | null;
          name: string;
          parser_strategy: Json | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          listing_url: string;
          logo_url?: string | null;
          name: string;
          parser_strategy?: Json | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          listing_url?: string;
          logo_url?: string | null;
          name?: string;
          parser_strategy?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> =
  Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> =
  Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> =
  Database["public"]["Tables"][T]["Update"];

export type Source = TableRow<"sources">;
export type SourceInsert = TableInsert<"sources">;
export type SourceUpdate = TableUpdate<"sources">;
export type Article = TableRow<"articles">;
export type ArticleInsert = TableInsert<"articles">;
export type ArticleAnalysis = TableRow<"article_analyses">;
export type ArticleAnalysisInsert = TableInsert<"article_analyses">;
export type Log = TableRow<"logs">;
export type LogInsert = TableInsert<"logs">;
export type OxylabsSchedule = TableRow<"oxylabs_schedules">;
export type OxylabsScheduleInsert = TableInsert<"oxylabs_schedules">;
export type OxylabsScheduleUpdate = TableUpdate<"oxylabs_schedules">;
export type OxylabsScheduleRun = TableRow<"oxylabs_schedule_runs">;
export type OxylabsScheduleRunInsert =
  TableInsert<"oxylabs_schedule_runs">;
export type OxylabsScheduleRunUpdate =
  TableUpdate<"oxylabs_schedule_runs">;

