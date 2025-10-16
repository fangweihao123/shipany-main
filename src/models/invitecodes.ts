import { invite_codes, invite_codes_vote } from "@/db/schema";
import { db } from "@/db";
import { and, desc, eq, lt } from "drizzle-orm";

export async function insertInvitecode(
  data: typeof invite_codes.$inferInsert
): Promise<typeof invite_codes.$inferSelect | undefined> {
  const [invitecode] = await db().insert(invite_codes).values(data).returning();
  return invitecode;
}

export async function findInvitecodeByCode(
  inviteCode: string
): Promise<typeof invite_codes.$inferSelect | undefined> {
  const [record] = await db()
    .select()
    .from(invite_codes)
    .where(eq(invite_codes.invite_code, inviteCode))
    .limit(1);
  return record;
}

export async function findInvitecodeByFingerPrint(
  fingerPrint: string
): Promise<typeof invite_codes.$inferSelect | undefined> {
  const [record] = await db()
    .select()
    .from(invite_codes)
    .where(eq(invite_codes.web_fingerprint, fingerPrint))
    .limit(1);
  return record;
}

export async function findInvitecodeVoteByFingerPrint(
  inviteCode: string,
  fingerPrint: string
): Promise<typeof invite_codes_vote.$inferSelect | undefined> {
  const [record] = await db()
    .select()
    .from(invite_codes_vote)
    .where(
      and(
        eq(invite_codes_vote.invite_code, inviteCode),
        eq(invite_codes_vote.web_fingerprint, fingerPrint)
      )
    )
    .limit(1);
  return record;
}

export async function voteInviteCode(
  data: typeof invite_codes_vote.$inferInsert
): Promise<typeof invite_codes_vote.$inferSelect | undefined>{
  const [invite_code] = await db()
    .select()
    .from(invite_codes)
    .where(eq(invite_codes.invite_code, data.invite_code))
    .limit(1);
  if(!invite_code){
    return undefined;
  }
  if(data.is_support){
    invite_code.voteup += 1;
  }else{
    invite_code.votedown += 1;
  }
  await db()
  .update(invite_codes)
  .set({voteup: invite_code.voteup, votedown: invite_code.votedown})
  .where(eq(invite_codes.invite_code, data.invite_code));
  
  const [vote] = await db()
                .insert(invite_codes_vote)
                .values(data)
                .returning();
  return vote;
}

export async function queryInviteCodes(
  limit: number = 10,
  max_votedown: number = 2
): Promise<typeof invite_codes.$inferSelect[]>{
  const inviteCodes = await db()
    .select()
    .from(invite_codes)
    .orderBy(desc(invite_codes.created_at))
    .where(lt(invite_codes.votedown, max_votedown))
    .limit(limit);
  return inviteCodes;
}
