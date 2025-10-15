import { insertInvitecode, queryInviteCodes, voteInviteCode } from "@/models/invitecodes";
import { invite_codes, invite_codes_vote } from "@/db/schema";

export async function addInviteCodeService(invite_code: string, ip: string, fingerPrint: string){
  const new_invite : typeof invite_codes.$inferInsert = {
    invite_code: invite_code,
    ip_address: ip,
    web_fingerprint: fingerPrint,
    created_at: new Date(),
    voteup: 0,
    votedown: 0
  };
  const invitecode = await insertInvitecode(new_invite);
  return invitecode;
}

export async function voteInviteCodeService(invite_code: string, ip: string, fingerPrint: string, isSupport: boolean){
  const new_invite : typeof invite_codes_vote.$inferInsert = {
    invite_code: invite_code,
    ip_address: ip,
    web_fingerprint: fingerPrint,
    created_at: new Date(),
    is_support: isSupport
  };
  const invitecode = await voteInviteCode(new_invite);
  return invitecode;
}

