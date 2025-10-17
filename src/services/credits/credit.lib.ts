import { UserCredits } from "@/types/user";
import { getUserCredits } from "../credit";

export async function HasEnoughCredits(user_uuid: string, creditsCost: number){
  const usercredits : UserCredits = await getUserCredits(user_uuid);
  return usercredits.left_credits >= creditsCost;
}
