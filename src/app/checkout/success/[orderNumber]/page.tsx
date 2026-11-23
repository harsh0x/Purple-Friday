import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams?: Promise<{ token?: string }>;
}

export default async function CheckoutSuccessRedirectPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params;
  const { token } = (await searchParams) || {};
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  redirect(`/order/${encodeURIComponent(orderNumber)}/confirmation${query}`);
}
