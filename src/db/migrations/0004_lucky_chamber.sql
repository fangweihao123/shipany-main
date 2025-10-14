CREATE TABLE "device_trial_usage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "device_trial_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"web_fingerprint" varchar(255) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"task_code" varchar(100) NOT NULL,
	"attempts_used" integer DEFAULT 0 NOT NULL,
	"first_used_at" timestamp with time zone,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "task_trial_config" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task_trial_config_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"task_code" varchar(100) NOT NULL,
	"max_attempts" integer NOT NULL,
	"period_unit" varchar(20) DEFAULT 'lifetime' NOT NULL,
	"period_value" integer,
	"description" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "device_trial_usage_unique" ON "device_trial_usage" USING btree ("web_fingerprint","ip_address","task_code");--> statement-breakpoint
CREATE UNIQUE INDEX "task_trial_config_unique" ON "task_trial_config" USING btree ("task_code");

