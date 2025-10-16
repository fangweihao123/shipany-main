import { findInvitecodeByCode, findInvitecodeByFingerPrint, findInvitecodeVoteByFingerPrint, insertInvitecode, voteInviteCode } from "@/models/invitecodes";
import { invite_codes, invite_codes_vote } from "@/db/schema";

export async function addInviteCodeService(invite_code: string, ip: string, fingerPrint: string){
  const normalizedCode = invite_code.trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error("invite_code_required");
  }
  if (!fingerPrint) {
    throw new Error("invite_code_missing_fingerprint");
  }

  const existed = await findInvitecodeByCode(normalizedCode);
  if (existed) {
    throw new Error("invite_code_duplicate");
  }

  const existedByFingerPrint = await findInvitecodeByFingerPrint(fingerPrint);
  if (existedByFingerPrint) {
    throw new Error("invite_code_already_submitted_by_user");
  }

  const new_invite : typeof invite_codes.$inferInsert = {
    invite_code: normalizedCode,
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
  const normalizedCode = invite_code.trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error("invite_code_required");
  }
  if (!fingerPrint) {
    throw new Error("invite_code_missing_fingerprint");
  }
  const existedVote = await findInvitecodeVoteByFingerPrint(normalizedCode, fingerPrint);
  if (existedVote) {
    throw new Error("invite_code_vote_duplicate");
  }
  const new_invite : typeof invite_codes_vote.$inferInsert = {
    invite_code: normalizedCode,
    ip_address: ip,
    web_fingerprint: fingerPrint,
    created_at: new Date(),
    is_support: isSupport
  };
  const invitecode = await voteInviteCode(new_invite);
  return invitecode;
}
