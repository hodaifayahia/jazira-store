export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_orders: {
        Row: {
          abandoned_at: string
          cart_items: Json
          cart_total: number
          created_at: string
          customer_name: string
          customer_phone: string
          customer_wilaya: string | null
          id: string
          item_count: number
          notes: string | null
          recovered_order_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          abandoned_at?: string
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_name: string
          customer_phone: string
          customer_wilaya?: string | null
          id?: string
          item_count?: number
          notes?: string | null
          recovered_order_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          abandoned_at?: string
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string
          customer_wilaya?: string | null
          id?: string
          item_count?: number
          notes?: string | null
          recovered_order_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_orders_recovered_order_id_fkey"
            columns: ["recovered_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      baladiyat: {
        Row: {
          id: string
          is_active: boolean | null
          name: string
          wilaya_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name: string
          wilaya_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name?: string
          wilaya_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baladiyat_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_settings: {
        Row: {
          assignment_mode: string
          auto_timeout_minutes: number
          created_at: string
          enable_confirm_chat: boolean
          id: string
          max_call_attempts: number
          updated_at: string
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          assignment_mode?: string
          auto_timeout_minutes?: number
          created_at?: string
          enable_confirm_chat?: boolean
          id?: string
          max_call_attempts?: number
          updated_at?: string
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          assignment_mode?: string
          auto_timeout_minutes?: number
          created_at?: string
          enable_confirm_chat?: boolean
          id?: string
          max_call_attempts?: number
          updated_at?: string
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: []
      }
      confirmers: {
        Row: {
          cancellation_price: number | null
          confirmation_price: number | null
          created_at: string | null
          email: string | null
          id: string
          monthly_salary: number | null
          name: string
          notes: string | null
          payment_mode: string
          phone: string
          status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancellation_price?: number | null
          confirmation_price?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_salary?: number | null
          name: string
          notes?: string | null
          payment_mode?: string
          phone: string
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancellation_price?: number | null
          confirmation_price?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_salary?: number | null
          name?: string
          notes?: string | null
          payment_mode?: string
          phone?: string
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coupon_products: {
        Row: {
          coupon_id: string
          id: string
          product_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          product_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_products_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          discount_type: string
          discount_value: number
          expiry_date: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          code: string
          discount_type: string
          discount_value: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          code?: string
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          baladiya: string | null
          coupon_code: string | null
          created_at: string | null
          customer_name: string
          customer_phone: string
          delivery_type: string | null
          discount_amount: number | null
          id: string
          order_number: string
          payment_method: string | null
          payment_receipt_url: string | null
          shipping_cost: number | null
          status: string | null
          subtotal: number | null
          total_amount: number | null
          user_id: string | null
          wilaya_id: string | null
        }
        Insert: {
          address?: string | null
          baladiya?: string | null
          coupon_code?: string | null
          created_at?: string | null
          customer_name: string
          customer_phone: string
          delivery_type?: string | null
          discount_amount?: number | null
          id?: string
          order_number: string
          payment_method?: string | null
          payment_receipt_url?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          user_id?: string | null
          wilaya_id?: string | null
        }
        Update: {
          address?: string | null
          baladiya?: string | null
          coupon_code?: string | null
          created_at?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_type?: string | null
          discount_amount?: number | null
          id?: string
          order_number?: string
          payment_method?: string | null
          payment_receipt_url?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          user_id?: string | null
          wilaya_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      product_offers: {
        Row: {
          created_at: string | null
          description: string
          id: string
          position: number | null
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          position?: number | null
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          position?: number | null
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_groups: {
        Row: {
          display_type: string
          id: string
          name: string
          position: number | null
          product_id: string
        }
        Insert: {
          display_type?: string
          id?: string
          name: string
          position?: number | null
          product_id: string
        }
        Update: {
          display_type?: string
          id?: string
          name?: string
          position?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          color_hex: string | null
          id: string
          label: string
          option_group_id: string
          position: number | null
        }
        Insert: {
          color_hex?: string | null
          id?: string
          label: string
          option_group_id: string
          position?: number | null
        }
        Update: {
          color_hex?: string | null
          id?: string
          label?: string
          option_group_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_options: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_options_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_options_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          compare_at_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          option_values: Json
          price: number
          product_id: string
          quantity: number
          sku: string | null
          updated_at: string | null
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          option_values?: Json
          price: number
          product_id: string
          quantity?: number
          sku?: string | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          option_values?: Json
          price?: number
          product_id?: string
          quantity?: number
          sku?: string | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          price_adjustment: number | null
          product_id: string
          stock: number | null
          variation_type: string
          variation_value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price_adjustment?: number | null
          product_id: string
          stock?: number | null
          variation_type: string
          variation_value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price_adjustment?: number | null
          product_id?: string
          stock?: number | null
          variation_type?: string
          variation_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string[]
          created_at: string | null
          description: string | null
          has_variants: boolean | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_free_shipping: boolean | null
          main_image_index: number | null
          name: string
          old_price: number | null
          price: number
          shipping_price: number | null
          short_description: string | null
          sku: string | null
          slug: string | null
          stock: number | null
        }
        Insert: {
          category: string[]
          created_at?: string | null
          description?: string | null
          has_variants?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_free_shipping?: boolean | null
          main_image_index?: number | null
          name: string
          old_price?: number | null
          price: number
          shipping_price?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          stock?: number | null
        }
        Update: {
          category?: string[]
          created_at?: string | null
          description?: string | null
          has_variants?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_free_shipping?: boolean | null
          main_image_index?: number | null
          name?: string
          old_price?: number | null
          price?: number
          shipping_price?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          reviewer_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          reviewer_name: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          chat_id: string
          state: Json
          updated_at: string
        }
        Insert: {
          chat_id: string
          state?: Json
          updated_at?: string
        }
        Update: {
          chat_id?: string
          state?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variation_options: {
        Row: {
          color_code: string | null
          created_at: string
          id: string
          is_active: boolean
          variation_type: string
          variation_value: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          variation_type: string
          variation_value: string
        }
        Update: {
          color_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          variation_type?: string
          variation_value?: string
        }
        Relationships: []
      }
      wilayas: {
        Row: {
          id: string
          is_active: boolean | null
          name: string
          shipping_price: number
          shipping_price_home: number
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name: string
          shipping_price: number
          shipping_price_home?: number
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name?: string
          shipping_price?: number
          shipping_price_home?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "confirmer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "confirmer"],
    },
  },
} as const
