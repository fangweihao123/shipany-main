import { getPage } from "@/services/page";
import InviteCodeListPageClient from "./invite-code-client";
import { InviteCodePage } from "@/types/pages/invitecode";


export async function getInviteCodePage(locale: string): Promise<InviteCodePage> {
  return (await getPage("invitecode", locale)) as InviteCodePage;
}

export default async function InviteCodePageFunc({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getInviteCodePage(locale);

  return <InviteCodeListPageClient copy={page.invitecode} />;
}
