"use client";

/** Last-resort error screen if even the main layout fails. */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ marginTop: "0.5rem" }}>Please try again. Your saved resources are safe.</p>
        <button
          type="button"
          onClick={() => retry()}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #94a3b8", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
