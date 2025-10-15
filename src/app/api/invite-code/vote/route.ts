import { respData, respErr } from "@/lib/resp";
import { getClientIp, getSerialCode } from "@/lib/ip";
import { voteInviteCodeService } from "@/services/invitecode/invitecode";

export async function POST(req: Request) {
  try {
    let { invite_code, is_support } = await req.json();
    if (!invite_code) {
      return respErr("invalid params");
    }
    const ip: string = await getClientIp();
    const fingerPrint = await getSerialCode();

    const inviteCode = await voteInviteCodeService(invite_code, ip, fingerPrint, is_support);
    return respData(inviteCode);
  } catch (e) {
    console.log("vote invite code failed", e);
    return respErr("vote invite code failed");
  }
}
