import { desc } from "drizzle-orm";
import { db } from "@/db";
import { cafes, notes } from "@/db/schema";
import { toDto } from "@/lib/dto";
import MapView from "@/components/MapView";
import BottomTabs from "@/components/BottomTabs";

export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { cafe } = await searchParams;
  const rows = await db.query.cafes.findMany({
    orderBy: desc(cafes.createdAt),
    with: { notes: { orderBy: desc(notes.createdAt) } },
  });
  const list = rows.map(toDto);
  return (
    <>
      <MapView
        cafes={list}
        initialSelectedId={typeof cafe === "string" ? cafe : null}
        jsKey={process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? ""}
      />
      <BottomTabs />
    </>
  );
}
