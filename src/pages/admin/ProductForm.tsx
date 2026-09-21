import { useEffect, useRef, useState } from "react";
import { adminAiProductContent, adminCreateProduct, adminUpdateProduct, adminUploadProductImage, type AdminProduct, type AdminProductInput } from "../../lib/admin";
import type { CategorySlug } from "../../lib/types";

const CATEGORIES: { slug: CategorySlug; name: string }[] = [
  { slug: "skincare", name: "Skincare" }, { slug: "face", name: "Face Care" },
  { slug: "body", name: "Body Care" }, { slug: "hair", name: "Hair Care" },
  { slug: "makeup", name: "Makeup" }, { slug: "sun", name: "Sun Protection" },
  { slug: "baby", name: "Baby & Mother" }, { slug: "wellness", name: "Wellness" },
];

/** millimes → editable dinar string (e.g. 28900 → "28.9"). */
function toDt(millimes: number | null): string {
  if (millimes == null) return "";
  return String(millimes / 1000);
}
/** dinar string → millimes (e.g. "28.9" → 28900). Empty → null. */
function toMillimes(dt: string): number | null {
  const n = parseFloat(dt.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 1000) : null;
}

interface Props {
  product: AdminProduct | null;   // null = create
  onClose: () => void;
  onSaved: () => void;
}

export function ProductForm({ product, onClose, onSaved }: Props) {
  const isEdit = !!product;
  const [title, setTitle] = useState(product?.title ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [category, setCategory] = useState<CategorySlug>(product?.category ?? "skincare");
  const [price, setPrice] = useState(toDt(product?.priceMillimes ?? null));
  const [oldPrice, setOldPrice] = useState(toDt(product?.oldPriceMillimes ?? null));
  const [image, setImage] = useState(product?.image ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [active, setActive] = useState(product?.active ?? true);
  const [description, setDescription] = useState(product?.description ?? "");
  const [howToUse, setHowToUse] = useState(product?.howToUse ?? "");
  const [ingredients, setIngredients] = useState(product?.ingredients ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onAiFill = async () => {
    if (aiBusy) return;
    if (!title.trim() || !brand.trim()) { setError("Enter the title and brand first, then let AI research it."); return; }
    setAiBusy(true); setError(null); setAiNote(null);
    try {
      const c = await adminAiProductContent({ title: title.trim(), brand: brand.trim(), category });
      if (c.description) setDescription(c.description);
      if (c.howToUse) setHowToUse(c.howToUse);
      if (c.ingredients) setIngredients(c.ingredients);
      setAiNote("AI draft added below — please review and edit before saving.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setImage(await adminUploadProductImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || uploading) return;
    const priceMillimes = toMillimes(price);
    if (!title.trim() || !brand.trim()) { setError("Title and brand are required."); return; }
    if (priceMillimes == null || priceMillimes < 0) { setError("Enter a valid price in dinars."); return; }
    if (!image.trim()) { setError("Please upload a product image."); return; }

    const input: AdminProductInput = {
      title: title.trim(), brand: brand.trim(), category,
      priceMillimes, oldPriceMillimes: oldPrice.trim() ? toMillimes(oldPrice) : null,
      image: image.trim(), stock: Math.max(0, parseInt(stock, 10) || 0), active,
      description: description.trim(), howToUse: howToUse.trim(), ingredients: ingredients.trim(),
    };

    setBusy(true); setError(null);
    try {
      if (isEdit) await adminUpdateProduct(product!.id, input);
      else await adminCreateProduct(input);
      onSaved();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  };

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label={isEdit ? "Edit product" : "Add product"}>
      <div className="admin-modal-overlay" onClick={onClose} />
      <form className="admin-modal-card" onSubmit={submit}>
        <header className="admin-modal-head">
          <h2>{isEdit ? "Edit product" : "Add product"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="admin-modal-body">
          <label className="admin-field"><span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </label>
          <label className="admin-field"><span>Brand</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} required />
          </label>

          <div className="admin-field-row">
            <label className="admin-field"><span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as CategorySlug)}>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="admin-field"><span>Stock</span>
              <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
            </label>
          </div>

          <div className="admin-field-row">
            <label className="admin-field"><span>Price (DT)</span>
              <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 28.9" required />
            </label>
            <label className="admin-field"><span>Old price (DT, optional)</span>
              <input inputMode="decimal" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="for a strike-through" />
            </label>
          </div>

          <div className="admin-field">
            <span>Product image</span>
            <div className="admin-upload">
              <div className="admin-upload-preview">
                {image ? <img src={image} alt="" /> : <span className="admin-upload-empty">No image yet</span>}
              </div>
              <div className="admin-upload-side">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
                <button type="button" className="admin-btn sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? "Uploading…" : image ? "Replace image" : "Upload image"}
                </button>
                {image && !uploading ? (
                  <button type="button" className="admin-link-btn" onClick={() => setImage("")}>Remove</button>
                ) : null}
                <span className="admin-upload-hint">JPG, PNG or WebP · up to 5 MB</span>
              </div>
            </div>
          </div>

          <label className="admin-check">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Visible on storefront</span>
          </label>

          <div className="admin-ai-head">
            <span className="admin-ai-title">Product details</span>
            <button type="button" className="admin-btn sm admin-ai-btn" onClick={onAiFill} disabled={aiBusy}>
              {aiBusy ? "Researching…" : "✨ Auto-fill with AI"}
            </button>
          </div>
          {aiNote ? <p className="admin-ai-note">{aiNote}</p> : null}

          <label className="admin-field"><span>Description</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short product description shown on the page." />
          </label>
          <label className="admin-field"><span>How to use</span>
            <textarea rows={4} value={howToUse} onChange={(e) => setHowToUse(e.target.value)} placeholder="Step-by-step usage. Review AI drafts for accuracy." />
          </label>
          <label className="admin-field"><span>Ingredients</span>
            <textarea rows={4} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Key ingredients. Review AI drafts for accuracy." />
          </label>

          {error ? <p className="admin-auth-error" role="alert">{error}</p> : null}
        </div>

        <footer className="admin-modal-foot">
          <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
        </footer>
      </form>
    </div>
  );
}
