import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { GadaiWidget } from "@/components/widgets/gadai-widget";

export const Route = createFileRoute("/gadai")({
  head: () => ({
    meta: [
      { title: "Unit Usaha Gadai & Lelang — Casheva Koperasi TNI AD" },
      { name: "description", content: "Layanan gadai syariah/konvensional emas & elektronik, Surat Bukti Gadai (SBG), dan etalase lelang barang sita." },
      { property: "og:title", content: "Unit Gadai & Lelang — Casheva" },
      { property: "og:description", content: "Layanan Gadai Emas, Gadget & Etalase Lelang Koperasi TNI AD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Unit Usaha Gadai & Etalase Lelang"
        description="Solusi dana cepat dengan agunan emas & gadget, taksiran standar pasar, administrasi amanah (SBG), dan etalase lelang terbuka bagi anggota."
      />
      <GadaiWidget />
    </div>
  );
}
