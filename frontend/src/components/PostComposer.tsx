import React, { memo, Suspense, useCallback, useEffect, useState } from "react";

import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import CodeBlock from "@tiptap/extension-code-block";

const EmojiPicker = React.lazy(() => import("emoji-picker-react"));

type PostComposerProps = {
  mode: "thread" | "reply";
  onSubmit: (data: {
    title?: string;
    content: string;
    notify: boolean;
  }) => void;
  submitText?: string;
  initialContent?: string;
};

type BlockMode = "normal" | "h2" | "h3";
type ListMode = "none" | "bullet" | "numbered";

const CODE_CLASS =
  "bg-[#222] text-[#09bcdc] text-left [direction:ltr] " +
  "[unicode-bidi:plaintext] block w-full max-w-full overflow-x-auto " +
  "whitespace-pre align-middle px-2 py-0.5 rounded font-mono text-[14px]";

const EDITOR_CLASSES = `
  min-h-[225px]
  bg-[#505050]
  text-white
  outline-none
  break-words
  [overflow-wrap:anywhere]

  [&_.ProseMirror]:min-h-[225px]
  [&_.ProseMirror]:bg-[#505050]
  [&_.ProseMirror]:p-[15px]
  [&_.ProseMirror]:text-[16px]
  [&_.ProseMirror]:leading-[1.6]
  [&_.ProseMirror]:text-white
  [&_.ProseMirror]:outline-none
  [&_.ProseMirror]:break-words
  [&_.ProseMirror]:[overflow-wrap:anywhere]

  [&_.ProseMirror_h2]:my-2
  [&_.ProseMirror_h2]:text-2xl
  [&_.ProseMirror_h2]:font-bold

  [&_.ProseMirror_h3]:my-2
  [&_.ProseMirror_h3]:text-xl
  [&_.ProseMirror_h3]:font-bold

  [&_.ProseMirror_ul]:mr-6
  [&_.ProseMirror_ul]:list-disc

  [&_.ProseMirror_ol]:mr-6
  [&_.ProseMirror_ol]:list-decimal

  [&_.ProseMirror_a]:text-cyan-300
  [&_.ProseMirror_a]:underline

  [&_.ProseMirror_pre]:m-0
  [&_.ProseMirror_pre]:my-2
  [&_.ProseMirror_pre]:max-w-full
  [&_.ProseMirror_pre]:overflow-x-auto
  [&_.ProseMirror_pre]:rounded
  [&_.ProseMirror_pre]:bg-[#222]
  [&_.ProseMirror_pre]:px-2
  [&_.ProseMirror_pre]:py-0.5
  [&_.ProseMirror_pre]:text-left
  [&_.ProseMirror_pre]:[direction:ltr]
  [&_.ProseMirror_pre]:[unicode-bidi:plaintext]

  [&_.ProseMirror_pre_code]:block
  [&_.ProseMirror_pre_code]:w-full
  [&_.ProseMirror_pre_code]:max-w-none
  [&_.ProseMirror_pre_code]:overflow-visible
  [&_.ProseMirror_pre_code]:whitespace-pre
  [&_.ProseMirror_pre_code]:bg-transparent
  [&_.ProseMirror_pre_code]:p-0
  [&_.ProseMirror_pre_code]:font-mono
  [&_.ProseMirror_pre_code]:text-[14px]
  [&_.ProseMirror_pre_code]:text-[#09bcdc]
  [&_.ProseMirror_pre_code]:text-left
  [&_.ProseMirror_pre_code]:[direction:ltr]
  [&_.ProseMirror_pre_code]:[unicode-bidi:plaintext]
`;

const FORCE_CODE_LTR_CSS = `
  .tiptap-custom-editor pre,
  .tiptap-custom-editor pre code {
    direction: ltr !important;
    text-align: left !important;
    unicode-bidi: plaintext !important;
    white-space: pre !important;
  }

  .tiptap-custom-editor .ProseMirror {
    caret-color: white;
  }

  .tiptap-custom-editor .ProseMirror p.is-editor-empty:first-child::before {
    color: #aaa;
    content: attr(data-placeholder);
    float: right;
    pointer-events: none;
    height: 0;
  }
`;

export default function PostComposer({
  mode,
  onSubmit,
  submitText,
  initialContent = "",
}: PostComposerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [title, setTitle] = useState("");
  const [notify, setNotify] = useState(false);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [isLinkActive, setIsLinkActive] = useState(false);
  const [blockMode, setBlockMode] = useState<BlockMode>("normal");
  const [listMode, setListMode] = useState<ListMode>("none");
  const [isCodeActive, setIsCodeActive] = useState(false);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [linkInputText, setLinkInputText] = useState("");
  const [hasSelection, setHasSelection] = useState(false);
  const [savedLinkSelection, setSavedLinkSelection] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const baseUrl = import.meta.env.BASE_URL;
  const isThread = mode === "thread";

  const updateToolbarStates = useCallback((currentEditor: Editor) => {
    if (!currentEditor) return;

    setBold(currentEditor.isActive("bold"));
    setItalic(currentEditor.isActive("italic"));
    setUnderline(currentEditor.isActive("underline"));
    setIsLinkActive(currentEditor.isActive("link"));

    if (currentEditor.isActive("heading", { level: 2 })) {
      setBlockMode("h2");
    } else if (currentEditor.isActive("heading", { level: 3 })) {
      setBlockMode("h3");
    } else {
      setBlockMode("normal");
    }

    if (currentEditor.isActive("bulletList")) {
      setListMode("bullet");
    } else if (currentEditor.isActive("orderedList")) {
      setListMode("numbered");
    } else {
      setListMode("none");
    }

    setIsCodeActive(currentEditor.isActive("codeBlock"));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: CODE_CLASS,
          dir: "ltr",
        },
        exitOnTripleEnter: true,
        exitOnArrowDown: true,
        enableTabIndentation: true,
        tabSize: 2,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "tiptap",
        dir: "rtl",
        "data-placeholder": "Enter text or type '/' for commands",
      },
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      updateToolbarStates(currentEditor);
    },
    onTransaction: ({ editor: currentEditor }) => {
      updateToolbarStates(currentEditor);
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, {
        emitUpdate: false,
      });
    }
  }, [editor, initialContent]);

  const executeStyle = useCallback(
    (style: "bold" | "italic" | "underline") => {
      if (!editor) return;

      const chain = editor.chain().focus();
      if (style === "bold") chain.toggleBold().run();
      if (style === "italic") chain.toggleItalic().run();
      if (style === "underline") chain.toggleUnderline().run();
    },
    [editor],
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(emoji).run();
    },
    [editor],
  );

  const toggleHeading = useCallback(
    (heading: "h2" | "h3") => {
      if (!editor) return;
      const level = heading === "h2" ? 2 : 3;
      editor.chain().focus().toggleHeading({ level }).run();
    },
    [editor],
  );

  const toggleList = useCallback(
    (list: "bullet" | "numbered") => {
      if (!editor) return;
      if (list === "bullet") {
        editor.chain().focus().toggleBulletList().run();
      } else {
        editor.chain().focus().toggleOrderedList().run();
      }
    },
    [editor],
  );

  const toggleCode = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleCodeBlock().run();
  }, [editor]);

  const clearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  const openLinkModal = useCallback(() => {
    if (!editor) return;

    // Save the exact selection before the modal receives focus.
    const { empty, from, to } = editor.state.selection;
    const previousUrl = editor.getAttributes("link").href ?? "";
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    setSavedLinkSelection({ from, to });
    setHasSelection(!empty);
    setLinkInputUrl(previousUrl);
    setLinkInputText(selectedText);
    setShowLinkModal(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(() => {
    if (!editor) return;

    const trimmedUrl = linkInputUrl.trim();
    if (!trimmedUrl) return;

    // The URL input has focus now, so restore the selection that existed
    // when the Link toolbar button was clicked.
    if (savedLinkSelection) {
      editor.commands.setTextSelection(savedLinkSelection);
    }

    if (hasSelection && savedLinkSelection) {
      editor
        .chain()
        .focus()
        .setLink({
          href: trimmedUrl,
          target: "_blank",
          rel: "noopener noreferrer",
        })
        .run();
    } else {
      const displayText = linkInputText.trim() || trimmedUrl;

      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: displayText,
          marks: [
            {
              type: "link",
              attrs: {
                href: trimmedUrl,
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
        })
        .insertContent(" ")
        .run();
    }

    setShowLinkModal(false);
    setSavedLinkSelection(null);
  }, [editor, linkInputUrl, linkInputText, hasSelection, savedLinkSelection]);

  const handleUnlink = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().unsetLink().run();
    setShowLinkModal(false);
  }, [editor]);

  const toggleDirection = useCallback(() => {
    if (!editor) return;

    setDirection((current) => (current === "rtl" ? "ltr" : "rtl"));
  }, [editor]);

  const handleSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editor) return;

      const html = `
      <div dir="${direction}" style="text-align:${
        direction === "rtl" ? "right" : "left"
      }">
        ${editor.getHTML()}
      </div>
    `;

      onSubmit({
        title: isThread ? title : undefined,
        content: html,
        notify,
      });
    },
    [editor, isThread, notify, onSubmit, title, direction],
  );

  return (
    <>
      <style>{FORCE_CODE_LTR_CSS}</style>

      <form
        onSubmit={handleSubmit}
        dir="rtl"
        className="mx-auto mt-8 w-full max-w-[1280px] rounded-lg bg-[#505050] sm:px-4 px-1 py-8 text-white"
      >
        {isThread && (
          <div className="mb-[22px]">
            <label htmlFor="post-title" className="mb-2 block text-[15px]">
              כותרת <span className="mr-1.5 text-red-700">חובה</span>
            </label>

            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="
                  box-border
                  h-[60px]
                  w-full
                  rounded-[5px]
                  border
                  border-[#888]
                  bg-[#505050]
                  px-2.5
                  py-2
                  text-[17px]
                  text-white
                  outline-none
                  focus:border-[#aaa]
                "
            />
          </div>
        )}

        <div className="mb-[22px]">
          <label className="mb-2 block text-[15px]">
            תוכן <span className="mr-1.5 text-red-700">חובה</span>
          </label>
          <p dir="ltr" className="text-left mb-2">
            To exit code block enter new line 3 times.
          </p>

          <div className="relative rounded-[5px] border border-[#888] bg-[#222]">
            <div
              className="
                    flex
                    h-fit
                    flex-col
                    sm:flex-row
                    items-center
                    justify-center
                    gap-2
                    relative
                    border-b
                    border-[#111]
                    bg-gradient-to-b
                    from-[#333]
                    to-[#222]
                    p-3
                  "
            >
              <div className="flex sm:gap-3 gap-1">
                <EditorButton
                  onClick={clearFormatting}
                  title="Clear formatting"
                >
                  Tx
                </EditorButton>

                <EditorButton
                  onClick={() => toggleHeading("h3")}
                  title="Heading 3"
                  active={blockMode === "h3"}
                >
                  H3
                </EditorButton>

                <EditorButton
                  onClick={() => toggleHeading("h2")}
                  title="Heading 2"
                  active={blockMode === "h2"}
                >
                  H2
                </EditorButton>

                <ToolbarSeparator />

                <div className="flex-1" />

                <EditorButton
                  onClick={toggleDirection}
                  title={
                    direction === "rtl" ? "Switch to LTR" : "Switch to RTL"
                  }
                >
                  <span dir="ltr">
                    {direction === "rtl" ? "RTL → LTR" : "LTR → RTL"}
                  </span>
                </EditorButton>

                <EditorButton
                  onClick={() => executeStyle("bold")}
                  title="Bold"
                  active={bold}
                >
                  <b>B</b>
                </EditorButton>
              </div>
              <div className="flex sm:gap-3 gap-1">
                <EditorButton
                  onClick={() => executeStyle("italic")}
                  title="Italic"
                  active={italic}
                >
                  <i>I</i>
                </EditorButton>

                <EditorButton
                  onClick={() => executeStyle("underline")}
                  title="Underline"
                  active={underline}
                >
                  <u>U</u>
                </EditorButton>

                <EditorButton
                  onClick={() => toggleList("bullet")}
                  title="Bullet list"
                  active={listMode === "bullet"}
                >
                  ☷
                </EditorButton>

                <EditorButton
                  onClick={() => toggleList("numbered")}
                  title="Numbered list"
                  active={listMode === "numbered"}
                >
                  1.
                </EditorButton>

                <ToolbarSeparator />

                <div>
                  <EditorButton
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    title="Emoji"
                  >
                    <img className="h-6" src={`${baseUrl}mood.png`} alt="" />
                  </EditorButton>

                  {showEmojiPicker && (
                    <div className="absolute sm:left-16 left-0 top-[120%] z-50 mt-2">
                      <Suspense fallback={null}>
                        <EmojiPicker
                          width={340}
                          onEmojiClick={(emojiData) => {
                            insertEmoji(emojiData.emoji);
                            setShowEmojiPicker(false);
                          }}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>

                <EditorButton
                  onClick={toggleCode}
                  title={isCodeActive ? "Exit code" : "Code"}
                  active={isCodeActive}
                >
                  <span dir="ltr" className="[direction:ltr] inline-block">
                    {"</>"}
                  </span>
                </EditorButton>

                <EditorButton
                  onClick={openLinkModal}
                  title="Link"
                  active={isLinkActive}
                >
                  🔗
                </EditorButton>
              </div>
            </div>

            <div
              style={{ display: "block" }}
              dir={direction}
              className={`tiptap-custom-editor ${
                direction === "rtl" ? "text-right" : "text-left"
              }`}
            >
              <EditorContent editor={editor} className={EDITOR_CLASSES} />
            </div>
          </div>
        </div>

        <div
          className="
              flex
              min-h-[65px]
              items-center
              justify-start
              gap-2.5
              border-b
              border-[#666]
              px-2.5
            "
        >
          <label className="relative inline-block h-[22px] w-[42px]">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="peer sr-only"
            />

            <span
              className="
                  absolute
                  inset-0
                  cursor-pointer
                  rounded-full
                  bg-[#777]
                  transition
                "
            />

            <span
              className="
                  absolute
                  left-[2px]
                  top-[2px]
                  h-[18px]
                  w-[18px]
                  rounded-full
                  bg-white
                  transition
                  peer-checked:translate-x-[20px]
                "
            />
          </label>

          <span>שלח התראה על תגובות חדשות</span>
        </div>

        <div className="flex justify-center gap-3 py-[22px]">
          <button
            type="submit"
            className="
                cursor-pointer
                rounded-[5px]
                border-0
                bg-[#09bcdc]
                px-[25px]
                py-[14px]
                text-[16px]
                text-[#111]
                transition
                hover:bg-[#19c8e5]
              "
          >
            {submitText ?? (isThread ? "פרסם נושא" : "שלח תגובה")}
          </button>
        </div>

        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg border border-[#666] bg-[#333] p-6 text-white shadow-xl">
              <h3 className="mb-4 text-lg font-bold">הוספת קישור</h3>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  כתובת URL:
                </label>

                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkInputUrl}
                  onChange={(e) => setLinkInputUrl(e.target.value)}
                  required
                  autoFocus
                  className="
                      w-full
                      rounded
                      border
                      border-[#666]
                      bg-[#222]
                      p-2
                      text-sm
                      text-white
                      outline-none
                      focus:border-[#09bcdc]
                    "
                />
              </div>

              {!hasSelection && (
                <div className="mb-6">
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    טקסט להצגה (אופציונלי):
                  </label>

                  <input
                    type="text"
                    placeholder="לחץ כאן"
                    value={linkInputText}
                    onChange={(e) => setLinkInputText(e.target.value)}
                    className="
                        w-full
                        rounded
                        border
                        border-[#666]
                        bg-[#222]
                        p-2
                        text-sm
                        text-white
                        outline-none
                        focus:border-[#09bcdc]
                      "
                  />
                </div>
              )}

              <div className="flex justify-between items-center gap-3">
                {isLinkActive ? (
                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="
                        rounded
                        bg-red-600/80
                        px-3
                        py-2
                        text-sm
                        hover:bg-red-600
                      "
                  >
                    הסר קישור
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="
                        rounded
                        bg-[#505050]
                        px-4
                        py-2
                        text-sm
                        hover:bg-[#606060]
                      "
                  >
                    ביטול
                  </button>

                  <button
                    type="button"
                    onClick={handleLinkSubmit}
                    className="
                        rounded
                        bg-[#09bcdc]
                        px-4
                        py-2
                        text-sm
                        font-bold
                        text-[#111]
                        hover:bg-[#19c8e5]
                      "
                  >
                    אישור
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </>
  );
}

const EditorButton = memo(function EditorButton({
  children,
  onClick,
  title,
  active = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      onClick={onClick}
      className={`
        flex
        h-[32px]
        min-w-[30px]
        cursor-pointer
        items-center
        justify-center
        rounded-[3px]
        border-0
        px-1
        
        transition
        text-[16px]
        ${
          active
            ? "bg-[#666] text-white"
            : "bg-transparent text-[#ddd] hover:bg-[#444]"
        }
      `}
    >
      {children}
    </button>
  );
});

const ToolbarSeparator = memo(function ToolbarSeparator() {
  return <span className="mx-[7px] h-[25px] w-px bg-[#555]" />;
});

// INSERT INTO threads (
//     forum_id,
//     user_id,
//     title,
//     content,
//     notify
// )
// VALUES ($1, $2, $3, $4, $5)
// RETURNING id, forum_id, user_id, title, content, notify, created_at;
