ALTER TABLE "cong_doan" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "san_luong" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cong_doan" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "san_luong" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;