import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PlayActiveIcon } from "@/ui/icons";
import type { Track } from "../../datasource/types";
import type { PlayHistoryEntry } from "../../player/playHistory";
import { TrackArtwork } from "./TrackArtwork";

/**
 * "On repeat": the tracks and artists you actually return to, counted from local play
 * history (the last 500 plays). Sits at the top of History.
 *
 * Nothing leaves the device and nothing is fetched: it is a tally of what is already stored.
 */

const RANGES = [
  { id: "week", label: "7 days", ms: 7 * 86_400_000 },
  { id: "month", label: "30 days", ms: 30 * 86_400_000 },
  { id: "all", label: "All", ms: Infinity },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

const TOP_COUNT = 5;
/** Below this many plays in the range a ranking is noise, so the section says so instead. */
const MIN_PLAYS = 5;

interface Ranked<T> {
  item: T;
  plays: number;
}

function rank<T>(entries: PlayHistoryEntry[], keyOf: (e: PlayHistoryEntry) => string | null, valueOf: (e: PlayHistoryEntry) => T) {
  const tally = new Map<string, Ranked<T> & { last: number }>();
  for (const entry of entries) {
    const key = keyOf(entry);
    if (!key) continue;
    const existing = tally.get(key);
    if (existing) {
      existing.plays++;
      existing.last = Math.max(existing.last, entry.playedAt);
    } else {
      tally.set(key, { item: valueOf(entry), plays: 1, last: entry.playedAt });
    }
  }
  // Ties go to whatever was played more recently.
  return [...tally.values()].sort((a, b) => b.plays - a.plays || b.last - a.last).slice(0, TOP_COUNT);
}

interface OnRepeatProps {
  entries: PlayHistoryEntry[];
  currentTrackId: string | null;
  onPlay: (track: Track, queue: Track[]) => void;
}

export function OnRepeat({ entries, currentTrackId, onPlay }: OnRepeatProps) {
  const [rangeId, setRangeId] = useState<RangeId>("month");

  const { tracks, artists, plays } = useMemo(() => {
    const range = RANGES.find((r) => r.id === rangeId)!;
    const since = Date.now() - range.ms;
    const inRange = entries.filter((entry) => entry.playedAt >= since);
    return {
      plays: inRange.length,
      tracks: rank(inRange, (e) => e.track.id, (e) => e.track),
      artists: rank(
        inRange,
        (e) => e.track.artist?.trim().toLowerCase() || null,
        (e) => ({ name: e.track.artist.trim(), artworkUrl: e.track.artworkUrl }),
      ),
    };
  }, [entries, rangeId]);

  const queue = tracks.map((ranked) => ranked.item);
  const enough = plays >= MIN_PLAYS && tracks.length > 0;

  return (
    <section aria-labelledby="on-repeat-title" className="flex flex-col gap-4 rounded-2xl bg-card/50 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="on-repeat-title" className="text-lg font-semibold text-foreground">
            On repeat
          </h2>
          {enough && (
            <button
              type="button"
              onClick={() => onPlay(queue[0], queue)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <PlayActiveIcon size={14} aria-hidden="true" />
              Play top {queue.length}
            </button>
          )}
        </div>

        <div role="radiogroup" aria-label="Time range" className="flex rounded-full bg-background/60 p-0.5">
          {RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              role="radio"
              aria-checked={rangeId === range.id}
              onClick={() => setRangeId(range.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                rangeId === range.id ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </header>

      {!enough ? (
        <p className="text-sm text-muted-foreground">
          Play a few more songs in this range and your most played tracks and artists show up here.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
          <ol className="flex flex-col gap-1" aria-label="Most played tracks">
            {tracks.map(({ item: track, plays: count }, index) => (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => onPlay(track, queue)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    currentTrackId === track.id && "bg-primary/10",
                  )}
                >
                  <span className="w-4 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <TrackArtwork artworkUrl={track.artworkUrl} className="size-10 shrink-0 rounded-md" iconSize={16} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cn("truncate text-sm font-medium", currentTrackId === track.id ? "text-primary" : "text-foreground")}>
                      {track.title}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{track.artist}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {count} {count === 1 ? "play" : "plays"}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <ol className="flex flex-col gap-1" aria-label="Most played artists">
            {artists.map(({ item: artist, plays: count }) => (
              <li key={artist.name} className="flex items-center gap-3 px-2 py-1.5">
                <TrackArtwork artworkUrl={artist.artworkUrl} className="size-9 shrink-0 rounded-full" iconSize={14} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{artist.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {count} {count === 1 ? "play" : "plays"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
