CREATE TABLE "rate_limit_blocks" (
	"key" text PRIMARY KEY NOT NULL,
	"blocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"violation_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_windows" (
	"key" text NOT NULL,
	"window" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limit_windows_key_window_pk" PRIMARY KEY("key","window")
);
--> statement-breakpoint
CREATE INDEX "idx_rate_limit_blocks_expires_at" ON "rate_limit_blocks" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_rate_limit_windows_expires_at" ON "rate_limit_windows" USING btree ("expires_at");