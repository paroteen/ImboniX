/**
 * Saved-contacts manager — used by Vision face recognition and Hearing
 * speaker identification. Stores name, relationship, optional photo.
 */
import React, { useRef, useState } from "react";
import { useImbonix, uid } from "../store";
import { Field } from "../ui";
import { UserPlus, X } from "lucide-react";

export default function ContactManager() {
  const { config, update } = useImbonix();
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onPhoto = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const save = () => {
    if (!name.trim()) return;
    update({ contacts: [...config.contacts, { id: uid(), name: name.trim(), relationship: rel.trim() || "Contact", photo }] });
    setName("");
    setRel("");
    setPhoto(undefined);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = (id: string) => update({ contacts: config.contacts.filter((c) => c.id !== id) });

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Relationship" value={rel} onChange={setRel} placeholder="e.g. sister, caregiver" />
      </div>
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])}
          className="text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-neon-cyan/15 file:text-neon-cyan file:text-xs file:font-mono" />
        {photo && <img src={photo} alt="preview" className="w-10 h-10 rounded-full object-cover border border-neon-cyan/40" />}
        <button onClick={save} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 font-mono text-xs uppercase tracking-wider hover:bg-neon-cyan/25 transition-colors">
          <UserPlus className="w-4 h-4" /> Save Contact
        </button>
      </div>

      {config.contacts.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {config.contacts.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-cyber-dark-1 border border-neutral-800">
              {c.photo ? (
                <img src={c.photo} alt={c.name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center text-[10px] font-bold">
                  {c.name.charAt(0)}
                </span>
              )}
              <span className="text-xs text-white">{c.name}</span>
              <button onClick={() => remove(c.id)} className="text-text-secondary hover:text-neon-magenta">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
