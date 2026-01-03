import { headers } from "next/headers";

export async function getEffectiveTime(): Promise<number> {
  const isTestMode = process.env.TEST_MODE === "1";
  if (!isTestMode) return Date.now();

  try {
    const headersList = await headers();
    const testHeader = headersList.get("x-test-now-ms");
    if (testHeader) {
      const parsed = parseInt(testHeader, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch (error) {
    console.log(error);
  }

  return Date.now();
}
