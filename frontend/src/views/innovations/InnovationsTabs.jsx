"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InnovationsBrowser from "@/views/innovations/InnovationsBrowser";
import IdeasGallery from "@/views/innovations/IdeasGallery";
import { useIdeasGallery } from "@/api/hooks/useIdeasQuery";

export default function InnovationsTabs({ innovations }) {
  const gallery = useIdeasGallery();

  return (
    <Tabs defaultValue="catalog" className="gap-4">
      <TabsList>
        <TabsTrigger value="catalog">Katalog ROPS ({innovations.length})</TabsTrigger>
        <TabsTrigger value="ideas">
          Pomysły mieszkańców{gallery.data ? ` (${gallery.data.length})` : ""}
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
