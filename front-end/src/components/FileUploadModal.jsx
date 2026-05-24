import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fetchAppConfig, uploadFiles } from "../api/uploads"

const FALLBACK_EXTENSIONS = [
  "txt", "md", "docx", "xlsx", "csv", "pdf", "json",
  "js", "jsx", "ts", "tsx", "py", "html", "css", "yaml", "yml", "xml",
]

function extOf(name) {
  const parts = (name || "").split(".")
  return parts.length > 1 ? parts.pop().toLowerCase() : ""
}

export function FileUploadModal({ open, onClose, onFilesReady, disabled }) {
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState("")
  const [pending, setPending] = useState([])
  const [uploadError, setUploadError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function load() {
      try {
        const data = await fetchAppConfig()
        if (!cancelled) setConfig(data)
      } catch (err) {
        if (!cancelled) {
          setConfigError(err.message || "Failed to load upload settings")
          setConfig({
            supported_extensions: FALLBACK_EXTENSIONS,
            max_upload_bytes: 10 * 1024 * 1024,
          })
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [open])

  const allowedExtensions = useMemo(
    () => config?.supported_extensions || FALLBACK_EXTENSIONS,
    [config]
  )

  const maxBytes = config?.max_upload_bytes || 10 * 1024 * 1024
  const acceptAttr = allowedExtensions.map((e) => `.${e}`).join(",")

  const validateFile = useCallback((file) => {
    const ext = extOf(file.name)
    if (!allowedExtensions.includes(ext)) {
      return `Unsupported file type (.${ext || "?"}). Allowed: ${allowedExtensions.map((e) => `.${e}`).join(", ")}`
    }
    if (file.size > maxBytes) {
      return `File exceeds ${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit.`
    }
    return null
  }, [allowedExtensions, maxBytes])

  const addFiles = useCallback((files) => {
    const next = []
    const errors = []
    files.forEach((file) => {
      const err = validateFile(file)
      if (err) {
        errors.push(`${file.name}: ${err}`)
        return
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        name: file.name,
        size: file.size,
      })
    })
    if (errors.length) setUploadError(errors.join(" "))
    else setUploadError("")
    if (next.length) setPending((prev) => [...prev, ...next])
  }, [validateFile])

  function onDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && uploadProgress === null) setDragActive(true)
  }

  function onDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function onDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled || uploadProgress !== null) return
    addFiles(Array.from(e.dataTransfer.files || []))
  }

  function onInputChange(e) {
    addFiles(Array.from(e.target.files || []))
    e.target.value = ""
  }

  function removePending(id) {
    setPending((prev) => prev.filter((f) => f.id !== id))
  }

  async function handleConfirm() {
    const ready = pending.filter((f) => f.file)
    if (!ready.length) {
      onClose()
      return
    }

    setUploadError("")
    setUploadProgress(0)

    try {
      const result = await uploadFiles(
        ready.map((f) => f.file),
        { onProgress: setUploadProgress }
      )
      onFilesReady(result?.files || [])
      setPending([])
      setUploadProgress(null)
      onClose()
    } catch (err) {
      setUploadError(err.message || "Upload failed")
      setUploadProgress(null)
    }
  }

  if (!open) return null

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Upload files">
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Attach files</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
            ×
          </button>
        </div>

        {configError && <div style={styles.warn}>{configError}</div>}

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            ...styles.dropzone,
            borderColor: dragActive ? "var(--brand-primary)" : "var(--border-strong)",
            background: dragActive ? "var(--surface-elevated)" : "var(--surface-sunken)",
          }}
        >
          <div style={styles.dropIcon}>↑</div>
          <p style={styles.dropText}>
            {dragActive ? "Drop files here…" : "Drag and drop files here"}
          </p>
          <button
            type="button"
            style={styles.pickBtn}
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploadProgress !== null}
          >
            Choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptAttr}
            style={{ display: "none" }}
            onChange={onInputChange}
          />
          <p style={styles.hint}>
            {allowedExtensions.map((e) => `.${e}`).join(", ")} · max {(maxBytes / (1024 * 1024)).toFixed(0)} MB
          </p>
        </div>

        {uploadError && <div style={styles.error}>{uploadError}</div>}

        {uploadProgress !== null && (
          <div style={styles.progressWrap}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
            </div>
            <span style={styles.progressLabel}>Uploading… {uploadProgress}%</span>
          </div>
        )}

        {pending.length > 0 && (
          <ul style={styles.fileList}>
            {pending.map((item) => (
              <li key={item.id} style={styles.fileItem}>
                <span style={styles.fileName}>{item.name}</span>
                <span style={styles.fileSize}>{(item.size / 1024).toFixed(1)} KB</span>
                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => removePending(item.id)}
                  disabled={uploadProgress !== null}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={uploadProgress !== null}>
            Cancel
          </button>
          <button
            type="button"
            style={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!pending.length || uploadProgress !== null}
          >
            {uploadProgress !== null ? "Uploading…" : `Attach ${pending.length || ""} file${pending.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(10, 12, 16, 0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 16,
    animation: "fade-in 0.15s ease",
  },
  modal: {
    width: "100%",
    maxWidth: 480,
    background: "var(--surface-raised)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-xl)",
    padding: 24,
    color: "var(--text-primary)",
    boxShadow: "var(--shadow-raised), 0 20px 60px rgba(0,0,0,0.4)",
    animation: "slide-up 0.2s ease",
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 16 
  },
  title: { 
    margin: 0, 
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },
  closeBtn: { 
    background: "var(--surface-sunken)", 
    border: "1px solid var(--border-subtle)", 
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)", 
    width: 32,
    height: 32,
    fontSize: 20, 
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "var(--transition-fast)",
  },
  dropzone: { 
    border: "2px dashed var(--border-strong)", 
    borderRadius: "var(--radius-md)", 
    padding: 32, 
    textAlign: "center", 
    marginBottom: 16,
    transition: "var(--transition-fast)",
    boxShadow: "var(--shadow-pressed)",
  },
  dropIcon: {
    fontSize: 28,
    color: "var(--text-tertiary)",
    marginBottom: 8,
  },
  dropText: { 
    margin: "0 0 16px", 
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  pickBtn: {
    padding: "10px 20px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-accent)",
    background: "var(--surface-elevated)",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "var(--shadow-soft)",
    transition: "var(--transition-fast)",
  },
  hint: { 
    margin: "16px 0 0", 
    fontSize: 11, 
    color: "var(--text-tertiary)" 
  },
  error: {
    background: "rgba(255, 107, 107, 0.1)",
    border: "1px solid rgba(255, 107, 107, 0.25)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
    fontSize: 13,
    color: "#ff6b6b",
    marginBottom: 16,
  },
  warn: { 
    fontSize: 12, 
    color: "var(--text-tertiary)", 
    marginBottom: 12 
  },
  progressWrap: { marginBottom: 16 },
  progressBar: { 
    height: 6, 
    background: "var(--surface-sunken)", 
    borderRadius: 4, 
    overflow: "hidden",
    boxShadow: "var(--shadow-pressed)",
  },
  progressFill: { 
    height: "100%", 
    background: "var(--brand-primary)", 
    transition: "width 0.2s",
    borderRadius: 4,
  },
  progressLabel: { 
    fontSize: 12, 
    color: "var(--text-secondary)", 
    marginTop: 8, 
    display: "block" 
  },
  fileList: { 
    listStyle: "none", 
    margin: "0 0 20px", 
    padding: 0, 
    display: "flex", 
    flexDirection: "column", 
    gap: 8 
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    boxShadow: "var(--shadow-pressed)",
  },
  fileName: { 
    flex: 1, 
    overflow: "hidden", 
    textOverflow: "ellipsis", 
    whiteSpace: "nowrap" 
  },
  fileSize: { 
    color: "var(--text-tertiary)", 
    fontSize: 11 
  },
  removeBtn: {
    background: "transparent",
    border: "1px solid rgba(255, 107, 107, 0.35)",
    color: "#ff6b6b",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 11,
    transition: "var(--transition-fast)",
  },
  actions: { 
    display: "flex", 
    gap: 12, 
    justifyContent: "flex-end" 
  },
  cancelBtn: {
    padding: "12px 20px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-default)",
    background: "transparent",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontWeight: 500,
    transition: "var(--transition-fast)",
  },
  confirmBtn: {
    padding: "12px 20px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-accent)",
    background: "var(--surface-elevated)",
    color: "var(--text-primary)",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "var(--shadow-raised)",
    transition: "var(--transition-fast)",
  },
}
