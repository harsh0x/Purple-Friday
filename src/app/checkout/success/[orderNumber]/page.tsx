import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

  export default async function CheckoutSuccessRedirectPage({ params }: PageProps) {
    const { orderNumber } = await params;
    redirect(`/order/${orderNumber}/confirmation`);
  }
