import { useEffect, useState } from "react";
import { API_BASE_URL as API } from "../../lib/api";
export default function LibrarySettings() {
  const [settings, setSettings] = useState({}),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });
  useEffect(() => {
    fetch(`${API}/api/settings`, { headers: headers() })
      .then(async (r) => {
        if (!r.ok) throw Error("Settings unavailable");
        setSettings((await r.json()).settings);
      })
      .catch((e) => setError(e.message));
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      const r = await fetch(`${API}/api/settings`, {
        method: "PATCH",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!r.ok) throw Error((await r.json()).message || "Save failed");
      setSaved(true);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-6">
      <h1 className="text-2xl font-bold">Library Settings</h1>
      <p>
        Policy changes apply to future operations only after their corresponding
        backend workflows support these settings.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {saved && <p role="status">Settings saved.</p>}
      <form onSubmit={save} className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <label className="flex justify-between gap-3" key={key}>
            <span>{key.replaceAll("_", " ")}</span>
            <input
              type="number"
              min="0"
              max="3650"
              className="rounded border p-2"
              value={value}
              onChange={(e) =>
                setSettings((s) => ({ ...s, [key]: Number(e.target.value) }))
              }
            />
          </label>
        ))}
        <button className="rounded bg-slate-900 px-4 py-2 text-white">
          Save settings
        </button>
      </form>
    </main>
  );
}
