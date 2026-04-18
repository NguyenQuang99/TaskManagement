import { useMemo, useRef, useState } from "react";

export default function ChangeAvatar({ setAvatar, initialAvatar }) {
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const previewUrl = useMemo(
    () => localPreviewUrl || initialAvatar || null,
    [localPreviewUrl, initialAvatar]
  );

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });

  const handlePickFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be smaller than 5MB.");
      return;
    }

    setError("");
    try {
      const base64 = await fileToDataUrl(file);
      const localPreview = URL.createObjectURL(file);
      setLocalPreviewUrl(localPreview);
      setAvatar(base64);
    } catch (e) {
      setError(e.message || "Failed to process image.");
    }
  };

  return (
    <section className="md:col-span-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5">
          <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handlePickFile}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
        >
          Change photo
        </button>

        {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}