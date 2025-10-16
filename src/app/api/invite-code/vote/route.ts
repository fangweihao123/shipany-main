import { respData, respErr } from "@/lib/resp";
import { getClientIp, getSerialCode } from "@/lib/ip";
import { voteInviteCodeService } from "@/services/invitecode/invitecode";

export async function POST(req: Request) {
  try {
    let { invite_code, is_support } = await req.json();
    if (!invite_code || typeof is_support !== "boolean") {
      return respErr("invalid params");
    }
    const ip: string = await getClientIp();
    const fingerPrint = await getSerialCode();

    const inviteCode = await voteInviteCodeService(invite_code, ip, fingerPrint, is_support);
    return respData(inviteCode);
  } catch (e) {
    console.log("vote invite code failed", e);
    const message =
      e instanceof Error && e.message ? e.message : "vote invite code failed";
    return respErr(message);
  }
}
