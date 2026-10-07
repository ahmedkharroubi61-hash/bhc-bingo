import { useCallback, useEffect, useRef, useState } from "react";
import { adminCreateCategory, adminUpdateCategory, adminUploadProductImage } from "../../lib/admin";
import { getCategories, invalidateCategories } from "../../lib/products";
import { categoryImage } from "../../data/categories";
import type { Category } from "../../lib/types";

/** Shop categories: add new ones with a picture, rename, or change the picture. */
export function AdminCategories() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [busy, setBusy] = useState(false);
  const newFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    invalidateCategories(); // the storefront re-reads the fresh list too
    setCats(await getCategories());
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (job: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await job(); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const pickNewImage = (file: File | undefined) => file && run(async () => {
    setNewImage(await adminUploadProductImage(file));
  });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const sort = (cats ?? []).reduce((m, c) => Math.max(m, c.sort), 0) + 1;
    run(async () => {
      await adminCreateCategory({ name: newName, image: newImage, sort });
      setNewName(""); setNewImage("");
    });
  };

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-h1">Categories</h1>
          <p className="admin-sub">The shop's categories and their pictures. A category appears in the menu and on the home page once it has products.</p>
        </div>
      </header>

      <form className="cat-add" onSubmit={add}>
        <button type="button" className="cat-thumb" onClick={() => newFileRef.current?.click()} disabled={busy} title="Choose a picture">
          {newImage ? <img src={newImage} alt="" /> : <span>+ Picture</span>}
        </button>
        <input ref={newFileRef} type="file" accept="image/*" hidden onChange={(e) => { pickNewImage(e.target.files?.[0]); e.target.value = ""; }} />
        <input className="admin-search" placeholder="New category name…" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy || !newName.trim() || !newImage}>+ Add category</button>
      </form>
      {error ? <p className="admin-error">{error}</p> : null}

      {!cats ? (
        <p className="admin-muted">Loading…</p>
      ) : (
        <div className="svc-list">
          {cats.map((c) => (
            <CategoryRow key={c.slug} cat={c} busy={busy}
              onRename={(name) => run(() => adminUpdateCategory(c.slug, { name }))}
              onImage={(file) => run(async () => adminUpdateCategory(c.slug, { image: await adminUploadProductImage(file) }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({ cat, busy, onRename, onImage }: {
  cat: Category; busy: boolean; onRename: (name: string) => void; onImage: (file: File) => void;
}) {
  const [name, setName] = useState(cat.name);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setName(cat.name); }, [cat.name]);
  const commit = () => { if (name.trim() && name.trim() !== cat.name) onRename(name.trim()); else setName(cat.name); };

  return (
    <div className="svc-row">
      <button type="button" className="cat-thumb" onClick={() => fileRef.current?.click()} disabled={busy} title="Change picture">
        <img src={categoryImage(cat)} alt="" />
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage(f); e.target.value = ""; }} />
      <input
        className="svc-name" value={name} aria-label={`Category name: ${cat.name}`}
        onChange={(e) => setName(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
      <span className="admin-muted cat-slug">/category/{cat.slug}</span>
    </div>
  );
}
