"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/design/Button";
import FaucetPanel from "@/components/operator/FaucetPanel";
import { fetchContributors, parseContributorsCsv, type Contributor } from "@/lib/github";

interface RecipientsStepProps {
  onNext: (contributors: Contributor[], selected: Set<string>, repoUrl: string) => void;
}

export default function RecipientsStep({ onNext }: RecipientsStepProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const csvInputRef = useRef<HTMLInputElement>(null);

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContributors(url.trim());
      setContributors(data);
      setSelected(new Set(data.map((c) => c.githubHandle)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load contributors.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const data = parseContributorsCsv(text);
      setContributors(data);
      setSelected(new Set(data.map((c) => c.githubHandle)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse CSV.");
    }
  }

  function toggleRow(handle: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(handle) ? next.delete(handle) : next.add(handle);
      return next;
    });
  }

  const canProceed = selected.size > 0;

  return (
    <div className="space-y-8">
      <FaucetPanel />

      {/* URL input */}
      <div>
        <label htmlFor="repo-url" className="block text-label text-ink-600 mb-2 uppercase tracking-wider">
          Repository
        </label>
        <div className="flex gap-3">
          <input
            id="repo-url"
            type="url"
            placeholder="github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            className="flex-1 border border-ink-200 rounded-input px-4 py-[10px] text-body text-ink-1000 placeholder:text-ink-400 focus:outline-none focus:border-ink-1000 transition-colors bg-ink-50"
          />
          <Button variant="primary" onClick={handleFetch} loading={loading} disabled={!url.trim()}>
            {loading ? "Loading…" : "Load contributors"}
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-small text-ink-1000">{error}</p>
        )}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="min-h-[44px] text-small text-ink-600 underline-offset-4 hover:underline"
          >
            Or upload a CSV with wallet addresses
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
          <p className="mt-1 text-code font-mono text-ink-400">
            Columns: address, github_handle, commits. Required to deploy — GitHub alone has no wallet data.
          </p>
        </div>
      </div>

      {/* Contributor list */}
      {contributors.length > 0 && (
        <div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2 border-b border-ink-200 mb-1">
            <span className="text-label text-ink-400 uppercase tracking-wider">Contributor</span>
            <span className="text-label text-ink-400 uppercase tracking-wider text-right">Commits</span>
            <span className="text-label text-ink-400 uppercase tracking-wider text-right">Additions</span>
            <span className="text-label text-ink-400 uppercase tracking-wider text-right w-8"></span>
          </div>

          <div className="divide-y divide-ink-100">
            {contributors.map((c) => {
              const isSelected = selected.has(c.githubHandle);
              return (
                <label
                  key={c.githubHandle}
                  className={[
                    "grid grid-cols-[1fr_auto_auto_auto] gap-4 py-3 items-center cursor-pointer",
                    "hover:bg-ink-100/40 -mx-2 px-2 rounded transition-colors",
                    !isSelected && "opacity-40",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={c.avatarUrl}
                      alt={c.githubHandle}
                      width={24}
                      height={24}
                      className="rounded-full flex-shrink-0"
                    />
                    <span className="font-mono text-code text-ink-800">@{c.githubHandle}</span>
                  </div>
                  <span className="font-mono text-code text-ink-600 text-right tabular-nums">
                    {c.commits.toLocaleString()}
                  </span>
                  <span className="font-mono text-code text-ink-600 text-right tabular-nums">
                    +{(c.additions / 1000).toFixed(0)}k
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(c.githubHandle)}
                    className="w-4 h-4 accent-ink-1000"
                  />
                </label>
              );
            })}
          </div>

          <p className="mt-4 text-small text-ink-400">
            {selected.size} of {contributors.length} contributors selected
          </p>
        </div>
      )}

      {canProceed && (
        <div className="flex justify-end pt-4 border-t border-ink-100">
          <Button variant="primary" onClick={() => onNext(contributors, selected, url.trim())}>
            Set allocations →
          </Button>
        </div>
      )}
    </div>
  );
}
