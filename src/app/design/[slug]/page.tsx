import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_PRODUCTS } from "@/lib/catalogue";
import { CustomizerClientWrapper } from "@/components/customizer/CustomizerClientWrapper";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = ALL_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    return {
      title: "Design Studio | Purple Friday",
    };
  }

  return {
    title: `Design Your Logo on ${product.shortName} | Purple Friday Studio`,
    description: `Upload your logo, adjust positioning, preview print quality in real-time, and order custom ${product.name} with instant tier volume pricing.`,
  };
}

export default async function DesignPage({ params }: PageProps) {
  const { slug } = await params;
  const product = ALL_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  return <CustomizerClientWrapper product={product} />;
}
