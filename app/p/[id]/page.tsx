import { notFound } from "next/navigation";
import Link from "next/link";
import { kv } from "@/lib/redis";
import { getEffectiveTime } from "@/lib/time";
import styles from "../../page.module.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PasteViewPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Fetch
  const paste = (await kv.hgetall(`paste:${id}`)) as Record<string, string>;

  if (!paste || Object.keys(paste).length === 0) {
    notFound();
  }

  // 2. Check Expiry
  const now = await getEffectiveTime();
  if (paste.expires_at) {
    const expiresAt = parseInt(paste.expires_at as string, 10);
    if (now > expiresAt) {
      notFound();
    }
  }

  // 3. Check & Update Views
  if (paste.views_remaining !== undefined && paste.views_remaining !== null) {
    const newViews = await kv.hincrby(`paste:${id}`, "views_remaining", -1);
    if (newViews < 0) {
      notFound();
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Paste: {id}</h1>
      <pre
        className={styles.textarea}
        style={{ backgroundColor: "#f4f4f4", cursor: "text", overflow: "auto" }}
      >
        {paste.content}
      </pre>
      <div style={{ marginTop: "1rem" }}>
        <Link href="/" className={styles.link}>
          Create New Paste
        </Link>
      </div>
    </div>
  );
}
