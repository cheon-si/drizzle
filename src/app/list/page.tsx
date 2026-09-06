import Link from "next/link";
import { asc, desc, eq, gte, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cafes, notes } from "@/db/schema";
import { toDto } from "@/lib/dto";
import BottomTabs from "@/components/BottomTabs";
import StarRating from "@/components/StarRating";
import { logout } from "@/app/actions";

export const dynamic = "force-dynamic";

const SORTS = {
  recent: { label: "최신순", order: desc(cafes.createdAt) },
  rating: { label: "별점순", order: desc(cafes.rating) },
  name: { label: "이름순", order: asc(cafes.name) },
} as const;
const FILTERS = {
  all: { label: "전체", where: undefined as SQL | undefined },
  visited: { label: "가봄", where: eq(cafes.status, "visited") },
  wishlist: { label: "가고싶음", where: eq(cafes.status, "wishlist") },
  top: { label: "★4.0+", where: gte(cafes.rating, "4.0") },
} as const;

type SortKey = keyof typeof SORTS;
type FilterKey = keyof typeof FILTERS;

export default async function ListPage({ searchParams }: PageProps<"/list">) {
  const sp = await searchParams;
  const sort: SortKey =
    typeof sp.sort === "string" && sp.sort in SORTS ? (sp.sort as SortKey) : "recent";
  const filter: FilterKey =
    typeof sp.filter === "string" && sp.filter in FILTERS
      ? (sp.filter as FilterKey)
      : "all";

  const rows = await db.query.cafes.findMany({
    where: FILTERS[filter].where,
    orderBy: [SORTS[sort].order, desc(cafes.createdAt)],
    with: { notes: { orderBy: desc(notes.createdAt), limit: 1 } },
  });
  const list = rows.map(toDto);
  const href = (s: SortKey, f: FilterKey) => `/list?sort=${s}&filter=${f}`;

  return (
    <main className="flex-1 pb-20">
      <header className="sticky top-0 z-10 bg-cream/95 px-4 pb-2 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            내 카페 <span className="text-latte-deep">{list.length}</span>
          </h1>
          <form action={logout}>
            <button className="text-xs text-mocha/70">로그아웃</button>
          </form>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto text-xs">
          {(Object.keys(FILTERS) as FilterKey[]).map((f) => (
            <Link
              key={f}
              href={href(sort, f)}
              className={`shrink-0 rounded-full px-3 py-1.5 ${
                filter === f ? "bg-coral text-white" : "bg-white text-mocha"
              }`}
            >
              {FILTERS[f].label}
            </Link>
          ))}
          <span className="mx-1 w-px bg-cream-deep" />
          {(Object.keys(SORTS) as SortKey[]).map((s) => (
            <Link
              key={s}
              href={href(s, filter)}
              className={`shrink-0 rounded-full px-3 py-1.5 ${
                sort === s ? "bg-latte text-white" : "bg-white text-mocha"
              }`}
            >
              {SORTS[s].label}
            </Link>
          ))}
        </div>
      </header>

      {list.length === 0 ? (
        <p className="mt-20 text-center text-sm text-mocha">
          아직 저장한 카페가 없어요.
          <br />
          지도에서 검색해 첫 카페를 저장해보세요 ☕️
        </p>
      ) : (
        <ul className="space-y-2 px-3 pt-2">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`/map?cafe=${c.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-deep/60 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">{c.name}</span>
                      {c.rating !== null && c.rating >= 4.5 && <span>❤️</span>}
                    </div>
                    <div className="truncate text-xs text-mocha">
                      {c.roadAddress || c.address}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                      c.status === "visited"
                        ? "bg-coral/15 text-coral-deep"
                        : "bg-latte/20 text-latte-deep"
                    }`}
                  >
                    {c.status === "visited" ? "가봄" : "가고싶음"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <StarRating value={c.rating} size="sm" />
                  <span className="text-xs text-latte-deep">
                    {c.rating?.toFixed(1) ?? ""}
                  </span>
                </div>
                {c.notes[0] && (
                  <p className="mt-2 line-clamp-2 text-sm text-mocha">
                    {c.notes[0].body}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <BottomTabs />
    </main>
  );
}
