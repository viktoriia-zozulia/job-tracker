-- applications: users can only reach their own rows through the Supabase API.
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "applications_select_own" ON "applications" FOR SELECT TO authenticated USING ((select auth.uid()) = "user_id");--> statement-breakpoint
CREATE POLICY "applications_insert_own" ON "applications" FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = "user_id");--> statement-breakpoint
CREATE POLICY "applications_update_own" ON "applications" FOR UPDATE TO authenticated USING ((select auth.uid()) = "user_id") WITH CHECK ((select auth.uid()) = "user_id");--> statement-breakpoint
CREATE POLICY "applications_delete_own" ON "applications" FOR DELETE TO authenticated USING ((select auth.uid()) = "user_id");--> statement-breakpoint
-- ai_usage: no policies on purpose. A write policy would let users reset their own AI limit. The server's role bypasses RLS.
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;
