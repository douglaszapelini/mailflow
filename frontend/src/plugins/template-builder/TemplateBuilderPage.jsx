import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useTemplateManager } from './useTemplateManager.js';
import { TemplateEditor } from './TemplateEditor.jsx';
import { blocksToEditorHtml } from './blocksToEditorHtml.js';
import { inputStyle, btnPrimary, btnSecondary, labelStyle } from './styles.js';
import { useMobile } from '../../hooks/useMobile.js';
import { useStore } from '../../store/index.js';

const DOMPURIFY_CONFIG = {
  ADD_TAGS: ['svg', 'path', 'circle', 'line', 'rect', 'polyline', 'polygon', 'ellipse'],
  ADD_ATTR: ['viewBox', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill', 'points', 'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'rx', 'ry', 'width', 'height', 'xmlns'],
};

export function TemplateBuilderPage() {
  const {
    templates, loading,
    selected, selectTemplate,
    showNew, inForm,
    form, setForm,
    saving, error,
    startCreate, startEdit, cancelEdit,
    pendingDelete, confirmDelete, cancelDelete, handleDelete,
    handleSave,
    previewHtml,
  } = useTemplateManager();

  const isMobile = useMobile();
  const setActivePluginView = useStore(s => s.setActivePluginView);
  const [mobilePanel, setMobilePanel] = useState('list');

  const handleSelectTemplate = (tpl) => {
    selectTemplate(tpl);
    if (isMobile) setMobilePanel('detail');
  };

  const handleStartCreate = () => {
    startCreate();
    if (isMobile) setMobilePanel('detail');
  };

  const handleGoBackToList = () => {
    setMobilePanel('list');
    cancelEdit();
  };

  const handleConfirmDelete = async () => {
    await confirmDelete();
    if (isMobile) setMobilePanel('list');
  };

  const listPanel = (
    <div style={{
      width: isMobile ? '100%' : 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: isMobile ? 'none' : '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      overflow: 'hidden', flex: isMobile ? 1 : 'none',
    }}>
      {!isMobile && (
        <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Templates</span>
            <button
              type="button"
              onClick={handleStartCreate}
              style={{
                background: 'var(--accent)', border: 'none', borderRadius: 6,
                color: '#fff', fontSize: 12, fontWeight: 500,
                padding: '4px 10px', cursor: 'pointer',
              }}
            >
              + New
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && !templates.length && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            Loading…
          </div>
        )}
        {!loading && !templates.length && (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
            No templates yet.
          </div>
        )}
        {templates.map(tpl => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => handleSelectTemplate(tpl)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 14px', cursor: 'pointer',
              background: selected?.id === tpl.id ? 'var(--bg-hover)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-subtle)',
              transition: 'background 0.1s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (selected?.id !== tpl.id) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            onMouseLeave={e => { if (selected?.id !== tpl.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {tpl.name}
            </div>
            {tpl.description && (
              <div style={{
                fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {tpl.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const detailPanel = (
    <>
      {!selected && !showNew && !isMobile && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-tertiary)', textAlign: 'center', gap: 14, padding: 24,
        }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.25 }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Select a template or create a new one
          </div>
          <button
            type="button"
            onClick={handleStartCreate}
            style={{
              marginTop: 4, background: 'var(--accent)', border: 'none', borderRadius: 7,
              color: '#fff', fontSize: 13, fontWeight: 500,
              padding: '7px 14px', cursor: 'pointer',
            }}
          >
            + New template
          </button>
        </div>
      )}

      {selected && !inForm && (
        <div style={{ width: '100%', maxWidth: 680, animation: 'pane-fade-in var(--motion-normal) var(--ease-emphasized) both' }}>
          {error && <ErrorBanner msg={error} />}

          {pendingDelete && (
            <DeleteConfirm
              name={pendingDelete.name}
              onConfirm={handleConfirmDelete}
              onCancel={cancelDelete}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.name}
              </h2>
              {selected.description && (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{selected.description}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button type="button" onClick={() => startEdit()} style={btnSecondary}>Edit</button>
              <button
                type="button"
                onClick={() => handleDelete(selected)}
                style={{ ...btnSecondary, color: 'var(--red, #f87171)', borderColor: 'color-mix(in srgb, var(--red, #f87171) 40%, transparent)' }}
              >
                Delete
              </button>
            </div>
          </div>

          <TiptapPreview html={blocksToEditorHtml(selected.blocks ?? [])} />
        </div>
      )}

      {inForm && (
        <div style={{ width: '100%', maxWidth: 680, animation: 'pane-fade-in var(--motion-normal) var(--ease-emphasized) both' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
            {showNew ? 'New template' : `Edit — ${selected?.name}`}
          </h2>

          {error && <ErrorBanner msg={error} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <label style={labelStyle}>
              Name *
              <input
                type="text"
                style={{ ...inputStyle, marginTop: 4 }}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </label>
            <label style={labelStyle}>
              Description
              <input
                type="text"
                style={{ ...inputStyle, marginTop: 4 }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, minHeight: 300 }}>
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10 }}>Blocks</div>
              <TemplateEditor blocks={form.blocks} onChange={blocks => setForm(f => ({ ...f, blocks }))} />
            </div>
            <div style={{ flex: '1 1 280px', minWidth: 0, borderLeft: isMobile ? 'none' : '1px solid var(--border)', borderTop: isMobile ? '1px solid var(--border)' : 'none', paddingLeft: isMobile ? 0 : 24, paddingTop: isMobile ? 24 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10 }}>Preview</div>
              <TiptapPreview html={previewHtml} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ ...btnPrimary, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save template'}
            </button>
            <button type="button" onClick={isMobile ? handleGoBackToList : cancelEdit} disabled={saving} style={btnSecondary}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    const mobileTitle = (mobilePanel === 'detail' && selected && !showNew)
      ? selected.name
      : (showNew ? 'New template' : 'Templates');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          paddingTop: 'calc(var(--sat) + 10px)',
          paddingBottom: 10, paddingLeft: 12, paddingRight: 12,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)', flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={mobilePanel === 'detail' ? handleGoBackToList : () => setActivePluginView(null)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', padding: 0, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 44, minHeight: 44,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <h2 style={{
            flex: 1, margin: 0, fontSize: 16, fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {mobileTitle}
          </h2>

          {mobilePanel === 'list' && (
            <button
              type="button"
              onClick={handleStartCreate}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 44, minHeight: 44,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          )}
        </div>

        {mobilePanel === 'list' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slide-in-left var(--motion-normal) var(--ease-emphasized) both' }}>
            {listPanel}
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden auto', padding: '16px 14px', animation: 'slide-in-right var(--motion-normal) var(--ease-emphasized) both' }}>
            {detailPanel}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {listPanel}
      <div
        key={selected?.id ?? (showNew ? 'new' : 'empty')}
        style={{
          flex: 1, overflowY: 'auto', minWidth: 0,
          padding: (!selected && !showNew) ? 0 : 32,
          ...(!selected && !showNew && { display: 'flex', alignItems: 'center', justifyContent: 'center' }),
        }}
      >
        {detailPanel}
      </div>
    </div>
  );
}

function TiptapPreview({ html }) {
  if (!html) {
    return (
      <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
        No blocks added yet.
      </div>
    );
  }
  return (
    <div className="tiptap-compose" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', background: 'var(--bg-primary)' }}>
      <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, DOMPURIFY_CONFIG) }} />
    </div>
  );
}

function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <div style={{
      marginBottom: 16, padding: '12px 14px', borderRadius: 8,
      background: 'color-mix(in srgb, var(--red, #f87171) 8%, transparent)',
      border: '1px solid color-mix(in srgb, var(--red, #f87171) 30%, transparent)',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>
        Delete <strong>{name}</strong>? This cannot be undone.
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            background: 'var(--red, #f87171)', border: 'none', borderRadius: 6,
            color: '#fff', fontSize: 12, fontWeight: 500, padding: '5px 12px', cursor: 'pointer',
          }}
        >
          Delete
        </button>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, padding: '5px 12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div style={{
      marginBottom: 16, padding: '10px 14px', borderRadius: 8,
      background: 'color-mix(in srgb, var(--red, #f87171) 10%, transparent)',
      border: '1px solid color-mix(in srgb, var(--red, #f87171) 30%, transparent)',
      fontSize: 13, color: 'var(--red, #f87171)',
    }}>
      {msg}
    </div>
  );
}
