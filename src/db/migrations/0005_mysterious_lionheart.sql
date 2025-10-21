CREATE TABLE "user_generations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_generations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"task_id" varchar(255) NOT NULL,
	"user_uuid" varchar(255),
	"device_fingerprint" varchar(255),
	"prompt" text NOT NULL,
	"mode" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"result_assets" jsonb DEFAULT 'null'::jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_generations_task_id_unique" ON "user_generations" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "user_generations_user_created_idx" ON "user_generations" USING btree ("user_uuid","created_at");