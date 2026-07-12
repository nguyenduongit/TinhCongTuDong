CREATE TABLE "cong_doan" (
	"id" serial PRIMARY KEY NOT NULL,
	"ma_cong_doan" text NOT NULL,
	"ten_cong_doan" text NOT NULL,
	"dinh_muc" numeric(10, 2) NOT NULL,
	"quy_cach" text DEFAULT '' NOT NULL,
	"order" bigint DEFAULT 0 NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "san_luong" (
	"id" serial PRIMARY KEY NOT NULL,
	"ngay" date NOT NULL,
	"chi_tiet" jsonb NOT NULL,
	"thong_ke_ngay" jsonb,
	"thoi_gian_thuc_hien" integer NOT NULL,
	"thoi_gian_ho_tro" integer DEFAULT 0,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "san_luong_ngay_user_id_unique" UNIQUE("ngay","user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "lich_trinh" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ngay" date NOT NULL,
	"loai" text NOT NULL,
	"so_phut" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cong_doan" ADD CONSTRAINT "cong_doan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "san_luong" ADD CONSTRAINT "san_luong_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lich_trinh" ADD CONSTRAINT "lich_trinh_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cong_doan_user_id_idx" ON "cong_doan" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "san_luong_ngay_idx" ON "san_luong" USING btree ("ngay");--> statement-breakpoint
CREATE INDEX "san_luong_user_id_idx" ON "san_luong" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lich_trinh_user_id_ngay_idx" ON "lich_trinh" USING btree ("user_id","ngay");