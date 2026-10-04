"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InnovationsBrowser from "@/views/innovations/InnovationsBrowser";
import IdeasGallery from "@/views/innovations/IdeasGallery";
import { useIdeasGallery } from "@/api/hooks/useIdeasQuery";
import { t } from "@/lib/i18n";

export default function InnovationsTabs({ innovations }) {
  const gallery = useIdeasGallery();

  return (
    <Tabs defaultValue="catalog" className="gap-4">
      <TabsList>
        <TabsTrigger value="catalog">{t("Katalog ROPS")} ({innovations.length})</TabsTrigger>
        <TabsTrigger value="ideas">
          {t("Pomysły mieszkańców")}{gallery.data ? ` (${gallery.data.length})` : ""}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="catalog">
        <InnovationsBrowser innovations={innovations} />
      </TabsContent>
      <TabsContent value="ideas">
        <IdeasGallery query={gallery} />
      </TabsContent>
    </Tabs>
  );
}
