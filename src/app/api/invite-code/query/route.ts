import { respData, respErr } from "@/lib/resp";
import { getClientIp, getSerialCode } from "@/lib/ip";
import { queryInviteCodes } from "@/models/invitecodes";

export async function POST(req: Request) {
  try {
    const inviteCodesArr = await queryInviteCodes();
    return respData(inviteCodesArr);
  } catch (e) {
    console.log("query invite code failed", e);
    return respErr("query invite code failed");
  }
}
