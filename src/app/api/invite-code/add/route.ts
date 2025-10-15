import { respData, respErr } from "@/lib/resp";
import { getClientIp, getSerialCode } from "@/lib/ip";
import { addInviteCodeService } from "@/services/invitecode/invitecode";

export async function POST(req: Request) {
  try {
    let { invite_code } = await req.json();
    if (!invite_code) {
      return respErr("invalid params");
    }
    const ip: string = await getClientIp();
    const fingerPrint = await getSerialCode();

    const inviteCode = await addInviteCodeService(invite_code, ip, fingerPrint);
    return respData(inviteCode);
  } catch (e) {
    console.log("add invite code failed", e);
    return respErr("add invite code failed");
  }
}
