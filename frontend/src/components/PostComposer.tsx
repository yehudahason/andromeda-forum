import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

type PostComposerProps = {
  mode: "thread" | "reply";
  onSubmit: (data: {
    title?: string;
    content: string;
    notify: boolean;
  }) => void;
  submitText?: string;
};

export default function PostComposer({
  mode,
  onSubmit,
  submitText,
}: PostComposerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notify, setNotify] = useState(false);
  const [preview, setPreview] = useState(false);

  // Link modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [linkInputText, setLinkInputText] = useState("");
  const [hasSelection, setHasSelection] = useState(false);

  const isThread = mode === "thread";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },

        code: {
          HTMLAttributes: {
            dir: "ltr",
            class:
              "bg-[#222] text-[#09bcdc] text-left [direction:ltr] [unicode-bidi:isolate] inline-block max-w-full overflow-x-auto whitespace-pre align-middle px-2 py-0.5 rounded font-mono text-[14px]",
          },
        },

        codeBlock: {
          HTMLAttributes: {
            dir: "ltr",
            class:
              "bg-[#222] text-[#09bcdc] text-left [direction:ltr] [unicode-bidi:isolate] overflow-x-auto whitespace-pre rounded p-3 font-mono text-[14px]",
          },
        },

        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: {
            class: "text-cyan-300 underline",
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      }),

      Underline,
    ],

    content: "",

    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  /*
   * Active toolbar states
   */
  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");
  const isUnderline = editor.isActive("underline");

  const isH2 = editor.isActive("heading", {
    level: 2,
  });

  const isH3 = editor.isActive("heading", {
    level: 3,
  });

  const isBulletList = editor.isActive("bulletList");

  const isOrderedList = editor.isActive("orderedList");

  const isCode = editor.isActive("code");

  /*
   * CODE TOGGLE
   *
   * OFF -> ON
   *
   * normal text
   *       ↓
   * <code>text</code>
   *
   *
   * ON -> OFF
   *
   * <code>text</code>
   *       ↓
   * <code>text</code>
   * <p></p>
   *
   * The important part is splitBlock().
   * toggleCode() alone only removes the code mark.
   */
  const toggleCode = () => {
    if (!editor.isActive("code")) {
      editor.chain().focus().toggleCode().run();

      return;
    }

    editor.chain().focus().unsetCode().splitBlock().run();
  };

  /*
   * Emoji
   */
  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();

    setShowEmojiPicker(false);
  };

  /*
   * Clear all formatting
   */
  const clearFormatting = () => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  };

  /*
   * H2
   */
  const toggleH2 = () => {
    editor
      .chain()
      .focus()
      .toggleHeading({
        level: 2,
      })
      .run();
  };

  /*
   * H3
   */
  const toggleH3 = () => {
    editor
      .chain()
      .focus()
      .toggleHeading({
        level: 3,
      })
      .run();
  };

  /*
   * Bullet list
   */
  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  /*
   * Numbered list
   */
  const toggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  /*
   * Open link modal
   */
  const openLinkModal = () => {
    const { from, to } = editor.state.selection;

    const selectedText = editor.state.doc.textBetween(from, to, " ");

    setHasSelection(from !== to);

    setLinkInputUrl(editor.getAttributes("link").href ?? "");

    setLinkInputText(selectedText);

    setShowLinkModal(true);
  };

  /*
   * Create / update link
   */
  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const url = linkInputUrl.trim();

    if (!url) {
      return;
    }

    if (hasSelection) {
      editor
        .chain()
        .focus()
        .setLink({
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
        })
        .run();
    } else {
      const text = linkInputText.trim() || url;

      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text,
          marks: [
            {
              type: "link",
              attrs: {
                href: url,
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
        })
        .run();
    }

    setShowLinkModal(false);
    setLinkInputUrl("");
    setLinkInputText("");
  };

  /*
   * Remove link
   */
  const removeLink = () => {
    editor.chain().focus().unsetLink().run();

    setShowLinkModal(false);
  };

  /*
   * Submit
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      title: isThread ? title : undefined,
      content: editor.getHTML(),
      notify,
    });
  };

  /*
   * Preview
   */
  const togglePreview = () => {
    setShowEmojiPicker(false);

    if (!preview) {
      setContent(editor.getHTML());
    }

    setPreview((prev) => !prev);
  };

  return (
    <div className="flex mt-4 w-full max-w-[1280px] mx-auto flex-col gap-4 justify-between items-center">
      {/* Preview */}
      {preview && (
        <>
          <p className="text-white">תצוגה מקדימה</p>

          <div
            dir="rtl"
            className="
              w-full
              max-w-[1280px]
              rounded-lg
              min-h-fit
              bg-[#505050]
              p-[15px]
              text-right
              text-[16px]
              leading-[1.6]
              text-white
              outline-none

              break-words
              [overflow-wrap:anywhere]

              [&_h2]:my-2
              [&_h2]:text-2xl
              [&_h2]:font-bold

              [&_h3]:my-2
              [&_h3]:text-xl
              [&_h3]:font-bold

              [&_ul]:mr-6
              [&_ul]:list-disc

              [&_ol]:mr-6
              [&_ol]:list-decimal

              [&_a]:text-cyan-300
              [&_a]:underline

              /* Inline code */
              [&_code]:bg-[#222]
              [&_code]:text-[#09bcdc]
              [&_code]:text-left
              [&_code]:[direction:ltr]
              [&_code]:[unicode-bidi:isolate]
              [&_code]:inline-block
              [&_code]:max-w-full
              [&_code]:overflow-x-auto
              [&_code]:whitespace-pre
              [&_code]:align-middle
              [&_code]:px-2
              [&_code]:py-0.5
              [&_code]:rounded
              [&_code]:font-mono
              [&_code]:text-[14px]

              /* Code blocks */
              [&_pre]:max-w-full
              [&_pre]:overflow-x-auto
              [&_pre]:whitespace-pre
              [&_pre]:break-words
              [&_pre]:bg-[#222]
              [&_pre]:rounded
              [&_pre]:p-3
              [&_pre]:text-left
              [&_pre]:[direction:ltr]
            "
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </>
      )}

      <form
        onSubmit={handleSubmit}
        dir="rtl"
        className="
          mx-auto
          mt-8
          w-full
          max-w-[1280px]
          rounded-lg
          bg-[#505050]
          px-4
          py-8
          text-white
        "
      >
        {/* Title */}
        {isThread && (
          <div className="mb-[22px]">
            <label
              htmlFor="post-title"
              className="
                mb-2
                block
                text-[15px]
              "
            >
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

        {/* Content */}
        <div className="mb-[22px]">
          <label
            className="
              mb-2
              block
              text-[15px]
            "
          >
            תוכן <span className="mr-1.5 text-red-700">חובה</span>
          </label>

          <div
            className="
              rounded-[5px]
              border
              border-[#888]
            "
          >
            {/* Toolbar */}
            <div
              className="
                flex
                h-fit
                items-center
                flex-wrap
                relative
                gap-[3px]
                border-b
                border-[#111]
                bg-gradient-to-b
                from-[#333]
                to-[#222]
                p-3
              "
            >
              {/* Clear formatting */}
              <EditorButton
                onClick={() => {
                  clearFormatting();
                  setPreview(false);
                }}
                title="Clear formatting"
              >
                Tx
              </EditorButton>

              {/* H3 */}
              <EditorButton
                onClick={() => {
                  toggleH3();
                  setPreview(false);
                }}
                title="Heading 3"
                active={isH3}
              >
                H3
              </EditorButton>

              {/* H2 */}
              <EditorButton
                onClick={() => {
                  toggleH2();
                  setPreview(false);
                }}
                title="Heading 2"
                active={isH2}
              >
                H2
              </EditorButton>

              <ToolbarSeparator />

              <div className="flex-1" />

              {/* Bold */}
              <EditorButton
                onClick={() => {
                  setPreview(false);

                  editor.chain().focus().toggleBold().run();
                }}
                title="Bold"
                active={isBold}
              >
                <b>B</b>
              </EditorButton>

              {/* Italic */}
              <EditorButton
                onClick={() => {
                  setPreview(false);

                  editor.chain().focus().toggleItalic().run();
                }}
                title="Italic"
                active={isItalic}
              >
                <i>I</i>
              </EditorButton>

              {/* Underline */}
              <EditorButton
                onClick={() => {
                  setPreview(false);

                  editor.chain().focus().toggleUnderline().run();
                }}
                title="Underline"
                active={isUnderline}
              >
                <u>U</u>
              </EditorButton>

              {/* Bullet list */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  toggleBulletList();
                }}
                title="Bullet list"
                active={isBulletList}
              >
                ☷
              </EditorButton>

              {/* Numbered list */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  toggleOrderedList();
                }}
                title="Numbered list"
                active={isOrderedList}
              >
                1.
              </EditorButton>

              <ToolbarSeparator />

              {/* Emoji */}
              <div>
                <EditorButton
                  onClick={() => {
                    setPreview(false);

                    setShowEmojiPicker((prev) => !prev);
                  }}
                  title="Emoji"
                >
                  ☺
                </EditorButton>

                {showEmojiPicker && (
                  <div
                    className="
                      absolute
                      -left-6
                      sm:left-0
                      top-full
                      z-50
                      mt-2
                    "
                  >
                    <EmojiPicker
                      width={340}
                      onEmojiClick={(emojiData) => {
                        insertEmoji(emojiData.emoji);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* CODE TOGGLE */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  toggleCode();
                }}
                title={isCode ? "Exit code" : "Code"}
                active={isCode}
              >
                {"</>"}
              </EditorButton>

              {/* Link */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  openLinkModal();
                }}
                title="Link"
                active={editor.isActive("link")}
              >
                🔗
              </EditorButton>
            </div>

            {/* Editor */}
            {!preview && (
              <EditorContent
                editor={editor}
                className="
                  min-h-[225px]
                  bg-[#505050]
                  text-white

                  [&_.ProseMirror]:min-h-[225px]
                  [&_.ProseMirror]:p-[15px]
                  [&_.ProseMirror]:text-right
                  [&_.ProseMirror]:text-[16px]
                  [&_.ProseMirror]:leading-[1.6]
                  [&_.ProseMirror]:outline-none

                  [&_.ProseMirror]:break-words
                  [&_.ProseMirror]:[overflow-wrap:anywhere]

                  /* H2 */
                  [&_.ProseMirror_h2]:my-2
                  [&_.ProseMirror_h2]:text-2xl
                  [&_.ProseMirror_h2]:font-bold

                  /* H3 */
                  [&_.ProseMirror_h3]:my-2
                  [&_.ProseMirror_h3]:text-xl
                  [&_.ProseMirror_h3]:font-bold

                  /* Lists */
                  [&_.ProseMirror_ul]:mr-6
                  [&_.ProseMirror_ul]:list-disc

                  [&_.ProseMirror_ol]:mr-6
                  [&_.ProseMirror_ol]:list-decimal

                  /* Links */
                  [&_.ProseMirror_a]:text-cyan-300
                  [&_.ProseMirror_a]:underline

                  /* Inline code */
                  [&_.ProseMirror_code]:bg-[#222]
                  [&_.ProseMirror_code]:text-[#09bcdc]
                  [&_.ProseMirror_code]:text-left
                  [&_.ProseMirror_code]:[direction:ltr]
                  [&_.ProseMirror_code]:[unicode-bidi:isolate]
                  [&_.ProseMirror_code]:inline-block
                  [&_.ProseMirror_code]:max-w-full
                  [&_.ProseMirror_code]:overflow-x-auto
                  [&_.ProseMirror_code]:whitespace-pre
                  [&_.ProseMirror_code]:align-middle
                  [&_.ProseMirror_code]:px-2
                  [&_.ProseMirror_code]:py-0.5
                  [&_.ProseMirror_code]:rounded
                  [&_.ProseMirror_code]:font-mono
                  [&_.ProseMirror_code]:text-[14px]

                  /* Code block */
                  [&_.ProseMirror_pre]:max-w-full
                  [&_.ProseMirror_pre]:overflow-x-auto
                  [&_.ProseMirror_pre]:whitespace-pre
                  [&_.ProseMirror_pre]:break-words
                  [&_.ProseMirror_pre]:bg-[#222]
                  [&_.ProseMirror_pre]:rounded
                  [&_.ProseMirror_pre]:p-3
                  [&_.ProseMirror_pre]:text-left
                  [&_.ProseMirror_pre]:[direction:ltr]
                  [&_.ProseMirror_pre]:[unicode-bidi:isolate]
                "
              />
            )}
          </div>
        </div>

        {/* Notification */}
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
          <label
            className="
              relative
              inline-block
              h-[22px]
              w-[42px]
            "
          >
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

        {/* Submit */}
        <div
          className="
            flex
            justify-center
            gap-3
            py-[22px]
          "
        >
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

          <button
            type="button"
            onClick={togglePreview}
            title="Preview"
            className="
              cursor-pointer
              rounded-[5px]
              border-0
              bg-[#333]
              px-[20px]
              py-[14px]
              text-[16px]
              text-white
              transition
              hover:bg-[#444]
            "
          >
            {preview ? "ערוך" : "תצוגה מקדימה"}
          </button>
        </div>

        {/* Link Modal */}
        {showLinkModal && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-black/60
              p-4
            "
          >
            <div
              className="
                w-full
                max-w-md
                rounded-lg
                border
                border-[#666]
                bg-[#333]
                p-6
                text-white
                shadow-xl
              "
            >
              <h3
                className="
                  mb-4
                  text-lg
                  font-bold
                "
              >
                הוספת קישור
              </h3>

              {/* URL */}
              <div className="mb-4">
                <label
                  className="
                    mb-1
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  כתובת URL:
                </label>

                <input
                  type="text"
                  placeholder="https://example.com"
                  value={linkInputUrl}
                  onChange={(e) => setLinkInputUrl(e.target.value)}
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

              {/* Display text */}
              {!hasSelection && (
                <div className="mb-6">
                  <label
                    className="
                      mb-1
                      block
                      text-sm
                      font-medium
                      text-gray-300
                    "
                  >
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

              {/* Buttons */}
              <div
                className="
                  flex
                  justify-end
                  gap-3
                "
              >
                {editor.isActive("link") && (
                  <button
                    type="button"
                    onClick={removeLink}
                    className="
                      rounded
                      bg-red-700
                      px-4
                      py-2
                      text-sm
                      hover:bg-red-600
                    "
                  >
                    הסר קישור
                  </button>
                )}

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
        )}
      </form>
    </div>
  );
}

function EditorButton({
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
        /*
         * Keep the editor selection when
         * clicking the toolbar.
         */
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
        text-[15px]
        transition
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
}

function ToolbarSeparator() {
  return (
    <span
      className="
        mx-[7px]
        h-[25px]
        w-px
        bg-[#555]
      "
    />
  );
}
