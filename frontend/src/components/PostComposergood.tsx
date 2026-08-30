import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
  Suspense,
} from "react";

// Lazy load heavy emoji picker bundle
const EmojiPicker = React.lazy(() => import("emoji-picker-react"));

type PostComposerProps = {
  mode: "thread" | "reply";
  onSubmit: (data: {
    title?: string;
    content: string;
    notify: boolean;
  }) => void;
  submitText?: string;
};

type BlockMode = "normal" | "h2" | "h3";
type ListMode = "none" | "bullet" | "numbered";

const EDITOR_CLASSES = `
  min-h-[225px]
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

  [&_code]:bg-[#222]
  [&_code]:text-[#09bcdc]
  [&_code]:text-left
  [&_code]:[direction:ltr]
  [&_code]:[unicode-bidi:plaintext]
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
`;

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
  const [isCodeActive, setIsCodeActive] = useState(false);

  // Active toolbar states
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [blockMode, setBlockMode] = useState<BlockMode>("normal");
  const [listMode, setListMode] = useState<ListMode>("none");

  // Custom Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [linkInputText, setLinkInputText] = useState("");
  const [hasSelection, setHasSelection] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const isThread = mode === "thread";

  const updateToolbarStates = useCallback(() => {
    setBold(document.queryCommandState("bold"));
    setItalic(document.queryCommandState("italic"));
    setUnderline(document.queryCommandState("underline"));

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const currentElement =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;

    if (!currentElement) return;

    const h2 = currentElement.closest("h2");
    const h3 = currentElement.closest("h3");
    const ul = currentElement.closest("ul");
    const ol = currentElement.closest("ol");
    const codeNode = currentElement.closest("code");

    if (h2) setBlockMode("h2");
    else if (h3) setBlockMode("h3");
    else setBlockMode("normal");

    if (ul) setListMode("bullet");
    else if (ol) setListMode("numbered");
    else setListMode("none");

    setIsCodeActive(Boolean(codeNode && editorRef.current?.contains(codeNode)));
  }, []);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }

    updateToolbarStates();
  }, [updateToolbarStates]);

  const restoreSelection = useCallback((): Range | null => {
    const editor = editorRef.current;
    if (!editor) return null;

    editor.focus();
    const selection = window.getSelection();
    if (!selection) return null;

    if (savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
      return savedRangeRef.current;
    }

    return null;
  }, []);

  const syncContentState = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }, []);

  const executeCommand = useCallback(
    (command: string, value: string | undefined = undefined) => {
      editorRef.current?.focus();
      restoreSelection();
      document.execCommand(command, false, value);
      syncContentState();
      updateToolbarStates();
    },
    [restoreSelection, syncContentState, updateToolbarStates],
  );

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement);

    const codeNode = container?.closest("code");

    if (codeNode && editorRef.current?.contains(codeNode)) {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      syncContentState();
      updateToolbarStates();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentHtml = editorRef.current?.innerHTML ?? content;

    onSubmit({
      title: isThread ? title : undefined,
      content: currentHtml,
      notify,
    });
  };

  const insertEmoji = (emoji: string) => {
    executeCommand("insertText", emoji);
  };

  const insertCode = () => {
    const editor = editorRef.current;
    if (!editor || preview) return;

    const range = restoreSelection();
    if (!range) return;

    const selection = window.getSelection();
    if (!selection) return;

    const codeElement = document.createElement("code");
    codeElement.setAttribute("dir", "ltr");
    codeElement.style.direction = "ltr";
    codeElement.style.unicodeBidi = "plaintext";
    codeElement.style.textAlign = "left";

    codeElement.className =
      "bg-bg text-[#09bcdc] text-left " +
      "[direction:ltr] [unicode-bidi:plaintext] " +
      "inline-block w-full overflow-x-auto " +
      "whitespace-pre align-middle px-2 py-0.5 " +
      "rounded font-mono text-[14px]";

    if (!range.collapsed) {
      const selectedContent = range.extractContents();
      codeElement.appendChild(selectedContent);
      range.insertNode(codeElement);

      const newRange = document.createRange();
      newRange.selectNodeContents(codeElement);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      const emptyText = document.createTextNode("\u200B");
      codeElement.appendChild(emptyText);
      range.insertNode(codeElement);

      // Focus at the START of the code element
      const newRange = document.createRange();
      newRange.setStart(emptyText, 0);
      newRange.collapse(true);

      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    setIsCodeActive(true);
    syncContentState();
    updateToolbarStates();
  };

  const focusAtEnd = (editor: HTMLElement) => {
    editor.focus();

    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(editor);
    range.collapse(false);

    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const escapeCode = () => {
    const editor = editorRef.current;
    if (!editor || preview) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    const container =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement);

    const codeElement = container?.closest("code");

    if (!codeElement || !editor.contains(codeElement)) {
      setIsCodeActive(false);
      return;
    }

    // Clean trailing break inside code tag if present
    if (codeElement.lastChild && codeElement.lastChild.nodeName === "BR") {
      codeElement.removeChild(codeElement.lastChild);
    }

    // Create a new line immediately AFTER the code element
    const newLine = document.createElement("div");

    // Zero-width character gives the div a real text position
    const caretNode = document.createTextNode("\u200B");
    newLine.appendChild(caretNode);

    if (codeElement.nextSibling) {
      codeElement.parentNode?.insertBefore(newLine, codeElement.nextSibling);
    } else {
      codeElement.parentNode?.appendChild(newLine);
    }

    // Put caret at the end of the new line
    const newRange = document.createRange();
    newRange.selectNodeContents(newLine);
    newRange.collapse(false);

    selection.removeAllRanges();
    selection.addRange(newRange);

    savedRangeRef.current = newRange.cloneRange();

    // Make sure editor remains focused
    editor.focus();

    // Re-apply the caret after focus
    selection.removeAllRanges();
    selection.addRange(newRange);

    setIsCodeActive(false);
    syncContentState();
    updateToolbarStates();

    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (editor) {
        focusAtEnd(editor);
        savedRangeRef.current =
          window.getSelection()?.getRangeAt(0).cloneRange() ?? null;
      }
    });
  };
  const toggleCode = () => {
    if (isCodeActive) {
      escapeCode();
    } else {
      insertCode();
    }
  };

  useEffect(() => {
    if (!preview && editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [preview, content]);

  const clearFormatting = () => {
    executeCommand("removeFormat");
    executeCommand("formatBlock", "<div>");
    setBlockMode("normal");
    setListMode("none");
    setIsCodeActive(false);
  };

  const toggleHeading = (heading: "h2" | "h3") => {
    const targetTag = blockMode === heading ? "<div>" : `<${heading}>`;
    executeCommand("formatBlock", targetTag);
  };

  const toggleList = (list: "bullet" | "numbered") => {
    const cmd = list === "bullet" ? "insertUnorderedList" : "insertOrderedList";
    executeCommand(cmd);
  };

  const openLinkModal = () => {
    saveSelection();
    const selection = window.getSelection();
    const isTextSelected = Boolean(selection && !selection.isCollapsed);

    setHasSelection(isTextSelected);
    setLinkInputUrl("");
    setLinkInputText(isTextSelected ? selection?.toString() || "" : "");
    setShowLinkModal(true);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = linkInputUrl.trim();
    if (!trimmedUrl) return;

    if (hasSelection) {
      executeCommand("createLink", trimmedUrl);
    } else {
      const displayText = linkInputText.trim() || trimmedUrl;
      executeCommand(
        "insertHTML",
        `<a class="text-cyan-300 underline" href="${trimmedUrl}" target="_blank" rel="noopener noreferrer">${displayText}</a> `,
      );
    }

    setShowLinkModal(false);
  };

  return (
    <div className="flex mt-4 w-full max-w-[1280px] mx-auto flex-col gap-4 justify-between items-center">
      {preview && (
        <>
          <p className="text-white">תצוגה מקדימה</p>

          <div
            className={`w-full max-w-[1280px] rounded-lg min-h-fit bg-[#505050] ${EDITOR_CLASSES}`}
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </>
      )}

      <form
        onSubmit={handleSubmit}
        dir="rtl"
        className="mx-auto mt-8 w-full max-w-[1280px] rounded-lg bg-[#505050] px-4 py-8 text-white"
      >
        {/* Title */}
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

        {/* Content */}
        <div className="mb-[22px]">
          <label className="mb-2 block text-[15px]">
            תוכן <span className="mr-1.5 text-red-700">חובה</span>
          </label>

          <div className="rounded-[5px] border border-[#888]">
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
              <EditorButton
                onClick={() => {
                  clearFormatting();
                  setPreview(false);
                }}
                title="Clear formatting"
              >
                Tx
              </EditorButton>

              <EditorButton
                onClick={() => {
                  toggleHeading("h3");
                  setPreview(false);
                }}
                title="Heading 3"
                active={blockMode === "h3"}
              >
                H3
              </EditorButton>

              <EditorButton
                onClick={() => {
                  toggleHeading("h2");
                  setPreview(false);
                }}
                title="Heading 2"
                active={blockMode === "h2"}
              >
                H2
              </EditorButton>

              <ToolbarSeparator />

              <div className="flex-1" />

              {/* Bold */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  executeCommand("bold");
                }}
                title="Bold"
                active={bold}
              >
                <b>B</b>
              </EditorButton>

              {/* Italic */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  executeCommand("italic");
                }}
                title="Italic"
                active={italic}
              >
                <i>I</i>
              </EditorButton>

              {/* Underline */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  executeCommand("underline");
                }}
                title="Underline"
                active={underline}
              >
                <u>U</u>
              </EditorButton>

              {/* Bullet list */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  toggleList("bullet");
                }}
                title="Bullet list"
                active={listMode === "bullet"}
              >
                ☷
              </EditorButton>

              {/* Numbered list */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  toggleList("numbered");
                }}
                title="Numbered list"
                active={listMode === "numbered"}
              >
                1.
              </EditorButton>

              <ToolbarSeparator />

              {/* Emoji */}
              <div>
                <EditorButton
                  onClick={() => {
                    setPreview(false);
                    saveSelection();
                    setShowEmojiPicker((prev) => !prev);
                  }}
                  title="Emoji"
                >
                  ☺
                </EditorButton>

                {showEmojiPicker && (
                  <div className="absolute -left-6 sm:left-0 top-full z-50 mt-2">
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

              {/* Code toggle */}
              <EditorButton
                onClick={toggleCode}
                title={isCodeActive ? "Exit code" : "Code"}
                active={isCodeActive}
              >
                <span
                  dir="ltr"
                  className="
                    [direction:ltr]
                    inline-block
                  "
                >
                  {"</>"}
                </span>
              </EditorButton>

              {/* Link */}
              <EditorButton
                onClick={() => {
                  setPreview(false);
                  openLinkModal();
                }}
                title="Link"
              >
                🔗
              </EditorButton>
            </div>

            {!preview && (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handlePaste}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                onBlur={saveSelection}
                className={EDITOR_CLASSES}
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

        {/* Submit */}
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

          <button
            type="button"
            onClick={() => {
              if (!preview && editorRef.current) {
                setContent(editorRef.current.innerHTML);
              }
              setShowEmojiPicker(false);
              setPreview((prev) => !prev);
            }}
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

        {/* Custom Link Modal Overlay */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg border border-[#666] bg-[#333] p-6 text-white shadow-xl">
              <h3 className="mb-4 text-lg font-bold">הוספת קישור</h3>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-300">
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

              <div className="flex justify-end gap-3">
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
});

const ToolbarSeparator = memo(function ToolbarSeparator() {
  return <span className="mx-[7px] h-[25px] w-px bg-[#555]" />;
});
