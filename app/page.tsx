"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState<number | null>(null);
  const [maxViews, setMaxViews] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResultUrl("");

    try {
      // Filter out null values
      const payload: Record<string, string | number> = { content };
      if (ttl !== null) payload.ttl_seconds = ttl;
      if (maxViews !== null) payload.max_views = maxViews;

      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create paste");
      }

      setResultUrl(data.url);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pastebin Lite</h1>

      {resultUrl ? (
        <div className={styles.success}>
          <h3>Paste Created!</h3>
          <p>Share this URL:</p>
          <a
            href={resultUrl}
            className={styles.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {resultUrl}
          </a>
          <br />
          <br />
          <button
            className={styles.button}
            onClick={() => {
              setResultUrl("");
              setContent("");
              setTtl(null);
              setMaxViews(null);
            }}
          >
            Create Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your text here..."
            required
          />

          <div className={styles.controls}>
            <label className={styles.label}>
              Expiration (TTL)
              <select
                className={styles.select}
                value={ttl || ""}
                onChange={(e) =>
                  setTtl(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Never</option>
                <option value="60">1 Minute</option>
                <option value="3600">1 Hour</option>
                <option value="86400">1 Day</option>
                <option value="604800">1 Week</option>
              </select>
            </label>

            <label className={styles.label}>
              Max Views
              <input
                type="number"
                className={styles.input}
                value={maxViews || ""}
                onChange={(e) =>
                  setMaxViews(e.target.value ? Number(e.target.value) : null)
                }
                min="1"
                placeholder="Unlimited"
              />
            </label>
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !content.trim()}
          >
            {loading ? "Creating..." : "Create Paste"}
          </button>

          {error && <div className={styles.error}>{error}</div>}
        </form>
      )}
    </div>
  );
}
