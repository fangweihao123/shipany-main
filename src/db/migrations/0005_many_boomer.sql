CREATE TABLE "invite_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invite_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invite_code" varchar(100) NOT NULL,
	"web_fingerprint" varchar(255) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"voteup" integer DEFAULT 0 NOT NULL,
	"votedown" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invite_codes_votes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invite_codes_votes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invite_code" varchar(100) NOT NULL,
	"web_fingerprint" varchar(255) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"is_support" boolean NOT NULL,
	"created_at" timestamp with time zone
);
