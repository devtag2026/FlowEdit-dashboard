"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  X, Check, ChevronDown, CheckSquare, Square,
  AlignJustify, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline as UnderlineIcon,
  Megaphone, List, ListOrdered, Heading2,
  RotateCcw, RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";

const RECIPIENTS = ["All", "Clients", "Contractors", "Management"];

const RECIPIENT_COLORS = {
  All:         "bg-accent/10 text-accent",
  Clients:     "bg-pink-100 text-pink-600",
  Contractors: "bg-primary/10 text-primary",
  Management:  "bg-amber-100 text-amber-700",
};

// ── Toolbar button ─────────────────────────────────────────────────────────
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

const Divider = () => <div className="w-px h-5 bg-accent/15 mx-0.5" />;

// ── Custom recipient dropdown (no Radix — avoids SelectItem click issues) ──
const RecipientDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full h-11 flex items-center justify-between px-3 rounded-xl border border-accent/20 bg-white hover:border-primary/50 transition-colors"
      >
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${RECIPIENT_COLORS[value]}`}>
          {value}
        </span>
        <ChevronDown className={`w-4 h-4 text-accent/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-accent/20 rounded-xl shadow-xl p-1">
          {RECIPIENTS.map((option) => {
            const isSelected = value === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => { onChange(option); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  isSelected ? "bg-primary/10" : "hover:bg-accent/5"
                }`}
              >
                {isSelected
                  ? <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                  : <Square className="w-4 h-4 text-accent/30 shrink-0" />
                }
                <span className={`font-medium flex-1 text-sm ${isSelected ? "text-primary" : "text-accent"}`}>
                  {option}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RECIPIENT_COLORS[option]}`}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const NewBroadcast = ({ onCancel, onCreate, creating }) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [formData, setFormData] = useState({
    title:      "",
    recipients: "All",
    content:    "",
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Write your broadcast message here..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor }) =>
      setFormData((prev) => ({ ...prev, content: editor.getHTML() })),
  });

  const handleSend = () => {
    if (!formData.title.trim()) {
      alert("Please enter a broadcast title.");
      return;
    }
    if (!formData.content || formData.content === "<p></p>") {
      alert("Please enter broadcast content.");
      return;
    }
    onCreate?.({
      title:    formData.title.trim(),
      message:  formData.content,
      audience: formData.recipients,
    });
  };

  const charCount = formData.content.replace(/<[^>]*>/g, "").length;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-accent leading-tight">New Broadcast</h2>
            <p className="text-xs text-accent/50">Send a message to your users</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-accent/10 rounded-full transition-colors text-accent/50 hover:text-accent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-accent">
            Title <span className="text-red-400">*</span>
          </label>
          <Input
            placeholder="Enter broadcast title..."
            className="bg-white border-accent/20 h-11 font-medium text-accent placeholder:text-accent/35 focus:border-primary focus-visible:ring-0"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Recipients — custom dropdown, no Radix */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-accent">Recipients</label>
          <RecipientDropdown
            value={formData.recipients}
            onChange={(v) => setFormData({ ...formData, recipients: v })}
          />
        </div>

        {/* Schedule */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-accent/15">
            <input
              type="checkbox"
              id="send-now"
              checked={!isScheduled}
              onChange={() => setIsScheduled((prev) => !prev)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <label htmlFor="send-now" className="text-sm font-medium text-accent cursor-pointer flex-1">
              Send immediately
            </label>
            {isScheduled && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">
                Scheduled
              </span>
            )}
          </div>
          {isScheduled && (
            <div className="flex flex-col lg:flex-row gap-3">
              <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="flex-1 h-10 border-accent/20 bg-white" />
              <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="flex-1 h-10 border-accent/20 bg-white" />
            </div>
          )}
        </div>

        {/* Rich text editor */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-accent">
            Message <span className="text-red-400">*</span>
          </label>

          <div className="rounded-xl border border-accent/20 bg-white overflow-hidden focus-within:border-primary transition-colors shadow-sm">
            <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-2 border-b border-accent/10 bg-slate-50/80">
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Bold (Ctrl+B)"><Bold className="w-3.5 h-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Italic (Ctrl+I)"><Italic className="w-3.5 h-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} title="Underline (Ctrl+U)"><UnderlineIcon className="w-3.5 h-3.5" /></ToolbarBtn>
              <Divider />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="Heading"><Heading2 className="w-3.5 h-3.5" /></ToolbarBtn>
              <Divider />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Bullet list"><List className="w-3.5 h-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></ToolbarBtn>
              <Divider />
              <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("left").run()} active={editor?.isActive({ textAlign: "left" })} title="Align left"><AlignLeft className="w-3.5 h-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("center").run()} active={editor?.isActive({ textAlign: "center" })} title="Align center"><AlignCenter className="w-3.5 h-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("right").run()} active={editor?.isActive({ textAlign: "right" })} title="Align right"><AlignRight className="w-3.5 h-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("justify").run()} active={editor?.isActive({ textAlign: "justify" })} title="Justify"><AlignJustify className="w-3.5 h-3.5" /></ToolbarBtn>
              <Divider />
              <ToolbarBtn onClick={() => editor?.chain().focus().undo().run()} active={false} title="Undo (Ctrl+Z)"><RotateCcw className="w-3.5 h-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().redo().run()} active={false} title="Redo (Ctrl+Y)"><RotateCw className="w-3.5 h-3.5" /></ToolbarBtn>
            </div>

            <EditorContent
              editor={editor}
              className="px-4 py-3 min-h-[160px] text-accent text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-accent [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:mb-1 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-accent/30 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
            />

            <div className="flex items-center justify-end px-4 py-1.5 border-t border-accent/5 bg-slate-50/50">
              <span className={`text-xs ${charCount > 1000 ? "text-amber-500" : "text-accent/30"}`}>
                {charCount} characters
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-accent/10">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={creating}
          className="text-accent/50 hover:text-accent hover:bg-accent/5 rounded-xl px-5"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSend}
          disabled={creating || !formData.title.trim()}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 px-6 min-w-[150px] disabled:opacity-50 transition-all"
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Send Broadcast
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NewBroadcast;