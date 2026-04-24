import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Trash2, X, ChevronDown, Loader2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteBroadcast, updateBroadcast } from "@/lib/queries/broadcast";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  AlignJustify, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Heading2, RotateCcw, RotateCw,
} from "lucide-react";

const ToolbarBtn = ({ onClick, active, children, title }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={`p-1.5 rounded-lg transition-colors ${
      active
        ? "bg-primary text-white shadow-sm"
        : "text-accent/60 hover:bg-accent/10 hover:text-accent"
    }`}
  >
    {children}
  </button>
);
const TDivider = () => <div className="w-px h-5 bg-accent/15 mx-0.5" />;

// ── Inline edit form ──────────────────────────────────────────────────────────
const EditForm = ({ broadcast, onSave, onCancel, saving }) => {
  const [title, setTitle] = useState(broadcast.title || "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: broadcast.content || broadcast.message || "",
    immediatelyRender: false,
  });

  const handleSave = () => {
    const content = editor?.getHTML() || "";
    if (!title.trim()) { alert("Title is required."); return; }
    if (!content || content === "<p></p>") { alert("Message is required."); return; }
    onSave({ title: title.trim(), message: content });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-accent">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white border-accent/20 h-11 font-medium focus:border-primary focus-visible:ring-0"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-accent">Message</label>
        <div className="rounded-xl border border-accent/20 bg-white overflow-hidden focus-within:border-primary transition-colors">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-2 border-b border-accent/10 bg-slate-50/80">
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} title="Underline"><UnderlineIcon className="w-3.5 h-3.5" /></ToolbarBtn>
            <TDivider />
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="Heading"><Heading2 className="w-3.5 h-3.5" /></ToolbarBtn>
            <TDivider />
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Bullet list"><List className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></ToolbarBtn>
            <TDivider />
            <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("left").run()} active={editor?.isActive({ textAlign: "left" })} title="Left"><AlignLeft className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("center").run()} active={editor?.isActive({ textAlign: "center" })} title="Center"><AlignCenter className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("right").run()} active={editor?.isActive({ textAlign: "right" })} title="Right"><AlignRight className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("justify").run()} active={editor?.isActive({ textAlign: "justify" })} title="Justify"><AlignJustify className="w-3.5 h-3.5" /></ToolbarBtn>
            <TDivider />
            <ToolbarBtn onClick={() => editor?.chain().focus().undo().run()} active={false} title="Undo"><RotateCcw className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().redo().run()} active={false} title="Redo"><RotateCw className="w-3.5 h-3.5" /></ToolbarBtn>
          </div>
          <EditorContent
            editor={editor}
            className="px-4 py-3 min-h-[140px] text-accent text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-accent/10">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving} className="text-accent/50 hover:text-accent rounded-xl">
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 px-5 disabled:opacity-60">
          {saving ? (
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
          ) : (
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Save changes</span>
          )}
        </Button>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const BroadcastDetail = ({
  broadcast,
  onBack,
  onDeleted,   
  onUpdated,   
  isMobile,
  activeFilter,
  setActiveFilter,
  sortOrder,
}) => {
  const [deleting, setDeleting]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteBroadcast(broadcast.id);
      onDeleted?.(); // → page calls load() + clears selectedBroadcast
      onBack?.();
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete broadcast. Please try again.");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleSave = async ({ title, message }) => {
    try {
      setSaving(true);
      await updateBroadcast(broadcast.id, { title, message });
      setEditing(false);
      onUpdated?.(); // → page calls load() + keeps selection (updated data)
    } catch (err) {
      console.error("Failed to update:", err);
      alert("Failed to update broadcast. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const Content = () => (
    <div
      className="prose prose-sm max-w-none text-accent/80 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-accent"
      dangerouslySetInnerHTML={{ __html: broadcast.content || broadcast.message || "" }}
    />
  );

  const DeleteConfirm = () => (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
      <p className="text-sm text-red-600 font-medium">Delete?</p>
      <button onClick={() => setShowConfirm(false)} className="text-xs text-red-400 hover:text-red-600 px-1">Cancel</button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 disabled:opacity-60 flex items-center gap-1"
      >
        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        Delete
      </button>
    </div>
  );

  // ── Mobile ──────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="bg-tertiary rounded-t-3xl p-4 pb-6 space-y-4">
        <div className="flex justify-center -mt-2 mb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {editing ? (
          <EditForm broadcast={broadcast} onSave={handleSave} onCancel={() => setEditing(false)} saving={saving} />
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-accent flex-1">{broadcast.title}</h2>
              <button onClick={onBack} className="p-2 hover:bg-accent/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-accent" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${broadcast.audienceColor} border-0`}>{broadcast.audience}</Badge>
              <span className="text-sm text-accent/70">
                {broadcast.status === "scheduled" ? `Scheduled for ${broadcast.scheduledFor}` : `Sent ${broadcast.sentAt}`}
              </span>
            </div>

            <div className="bg-accent/5 rounded-xl p-4"><Content /></div>

            {broadcast.status === "sent" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent/5 rounded-xl p-3">
                  <p className="text-xs text-accent/60 mb-1">Views</p>
                  <p className="text-2xl font-bold text-accent">{broadcast.views}</p>
                </div>
                <div className="bg-accent/5 rounded-xl p-3">
                  <p className="text-xs text-accent/60 mb-1">Recipients</p>
                  <p className="text-2xl font-bold text-accent">{broadcast.audience || "All"}</p>
                </div>
              </div>
            )}

            {showConfirm && <DeleteConfirm />}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="flex-1 border-accent/20 text-accent h-11 rounded-xl gap-2"
              >
                <Pencil className="w-4 h-4" /> Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowConfirm(true)}
                disabled={deleting}
                className="flex-1 text-red-500 hover:bg-red-50 h-11 rounded-xl gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Desktop ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["All", "Contractors", "Clients", "Management"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter?.(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                activeFilter === filter ? "bg-primary text-white shadow-md" : "bg-tertiary text-accent hover:bg-accent/5"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-tertiary rounded-full text-sm font-medium text-accent hover:bg-accent/5 transition-all cursor-pointer">
          {sortOrder || "Newest First"}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Header card */}
      <div className="bg-tertiary rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-accent mb-2">{broadcast.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${broadcast.audienceColor} border-0`}>{broadcast.audience}</Badge>
              <span className="text-sm text-accent/70">
                {broadcast.status === "scheduled" ? `Scheduled for ${broadcast.scheduledFor}` : `Sent ${broadcast.sentAt}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Edit button */}
            {!editing && (
              <button
                onClick={() => { setEditing(true); setShowConfirm(false); }}
                className="p-2 hover:bg-accent/10 rounded-lg transition-colors cursor-pointer group"
                title="Edit broadcast"
              >
                <Pencil className="w-5 h-5 text-accent/50 group-hover:text-accent transition-colors" />
              </button>
            )}

            {/* Delete button / confirm */}
            {!editing && (
              showConfirm ? (
                <DeleteConfirm />
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={deleting}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer group"
                  title="Delete broadcast"
                >
                  <Trash2 className="w-5 h-5 text-accent/50 group-hover:text-red-500 transition-colors" />
                </button>
              )
            )}

            {/* Close */}
            <button
              onClick={onBack}
              className="p-2 hover:bg-accent/5 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5 text-accent" />
            </button>
          </div>
        </div>
      </div>

      {/* Content or edit form */}
      <div className="bg-tertiary rounded-2xl p-6">
        {editing ? (
          <EditForm broadcast={broadcast} onSave={handleSave} onCancel={() => setEditing(false)} saving={saving} />
        ) : (
          <Content />
        )}
      </div>

      {/* Stats */}
      {!editing && broadcast.status === "sent" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-tertiary rounded-2xl p-6">
            <p className="text-sm text-accent/60 mb-2">Total Views</p>
            <p className="text-3xl font-bold text-accent">{broadcast.views}</p>
          </div>
          <div className="bg-tertiary rounded-2xl p-6">
            <p className="text-sm text-accent/60 mb-2">Recipients</p>
            <p className="text-3xl font-bold text-accent">{broadcast.audience || "All"}</p>
          </div>
          <div className="bg-tertiary rounded-2xl p-6">
            <p className="text-sm text-accent/60 mb-2">Priority</p>
            <Badge className={`${broadcast.priorityColor} border-0 text-sm px-3 py-1`}>{broadcast.priority}</Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastDetail;