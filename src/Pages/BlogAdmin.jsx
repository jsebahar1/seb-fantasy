import { useState, useCallback } from 'react';
import './BlogAdmin.css';

const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO  = import.meta.env.VITE_GITHUB_REPO;
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const FILE_PATH = 'src/data/blogPosts.js';

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function formatDateLabel(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function blockToContent(block) {
  if (block.type === 'paragraph') return block.value;
  if (block.type === 'h3') return `<h3>${block.value}</h3>`;
  if (block.type === 'pullquote') return `<blockquote class="post-pullquote">${block.value}</blockquote>`;
  if (block.type === 'olist') {
    const items = block.items.filter(i => i.trim()).map(i => `<li>${i}</li>`).join('');
    return `<ol>${items}</ol>`;
  }
  return block.value;
}

function uid() { return Math.random().toString(36).slice(2); }

// ── GitHub API ────────────────────────────────────────────────────────────────

async function publishToGitHub(post) {
  const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

  // 1. get current file
  const getRes = await fetch(apiBase, { headers });
  if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`);
  const { content: encoded, sha } = await getRes.json();

  // 2. decode (GitHub returns base64 with newlines)
  const currentContent = decodeURIComponent(escape(atob(encoded.replace(/\n/g, ''))));

  // 3. build the JS object string for the new post
  const postJS = JSON.stringify(post, null, 2);

  // 4. insert at the start of the array
  const marker = 'export const blogPosts = [';
  const insertAt = currentContent.indexOf(marker) + marker.length;
  if (insertAt < marker.length) throw new Error('Could not find blogPosts array in file');
  const newContent = currentContent.slice(0, insertAt) + '\n  ' + postJS + ',' + currentContent.slice(insertAt);

  // 5. encode and commit
  const bytes = new TextEncoder().encode(newContent);
  const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
  const newEncoded = btoa(binary);

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `blog: add "${post.title}"`,
      content: newEncoded,
      sha,
    }),
  });
  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(err.message || `GitHub PUT failed: ${putRes.status}`);
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  function submit(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      onAuth();
    } else {
      setError('Incorrect password.');
    }
  }

  return (
    <div className="ba-gate">
      <p className="ba-gate-logo">SEB<span>admin</span></p>
      <form className="ba-gate-form" onSubmit={submit}>
        <label className="ba-label">Password</label>
        <input
          className="ba-input"
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          autoFocus
          required
        />
        {error && <p className="ba-error">{error}</p>}
        <button className="ba-btn-primary" type="submit">
          Sign In →
        </button>
      </form>
    </div>
  );
}

function KeywordInput({ keywords, setKeywords }) {
  const [input, setInput] = useState('');
  function add() {
    const trimmed = input.trim();
    if (trimmed && !keywords.includes(trimmed)) setKeywords([...keywords, trimmed]);
    setInput('');
  }
  function onKey(e) { if (e.key === 'Enter') { e.preventDefault(); add(); } }
  return (
    <div className="ba-keyword-wrap">
      {keywords.map(k => (
        <span key={k} className="ba-kw-chip">
          {k}
          <button type="button" onClick={() => setKeywords(keywords.filter(x => x !== k))}>×</button>
        </span>
      ))}
      <input
        className="ba-input ba-kw-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        placeholder="Type keyword, press Enter"
      />
    </div>
  );
}

function BlockEditor({ block, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  function field(e) { onChange({ ...block, value: e.target.value }); }
  function changeType(e) {
    const t = e.target.value;
    onChange(t === 'olist'
      ? { ...block, type: t, value: '', items: [''] }
      : { ...block, type: t, value: '' });
  }
  function setItem(i, v) {
    const items = [...block.items];
    items[i] = v;
    onChange({ ...block, items });
  }
  function addItem() { onChange({ ...block, items: [...block.items, ''] }); }
  function removeItem(i) { onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) }); }

  const typeLabels = { paragraph: 'Paragraph', h3: 'Section Header', pullquote: 'Pull Quote', olist: 'Numbered List' };

  return (
    <div className="ba-block">
      <div className="ba-block-top">
        <select className="ba-select ba-block-type" value={block.type} onChange={changeType}>
          {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="ba-block-actions">
          <button type="button" className="ba-icon-btn" onClick={onMoveUp} disabled={isFirst} title="Move up">↑</button>
          <button type="button" className="ba-icon-btn" onClick={onMoveDown} disabled={isLast} title="Move down">↓</button>
          <button type="button" className="ba-icon-btn ba-icon-btn--del" onClick={onRemove} title="Remove">×</button>
        </div>
      </div>

      {block.type === 'olist' ? (
        <div className="ba-list-editor">
          {block.items.map((item, i) => (
            <div key={i} className="ba-list-row">
              <span className="ba-list-num">{i + 1}.</span>
              <input
                className="ba-input"
                value={item}
                onChange={e => setItem(i, e.target.value)}
                placeholder={`Item ${i + 1}`}
              />
              {block.items.length > 1 && (
                <button type="button" className="ba-icon-btn ba-icon-btn--del" onClick={() => removeItem(i)}>×</button>
              )}
            </div>
          ))}
          <button type="button" className="ba-add-item-btn" onClick={addItem}>+ Add item</button>
        </div>
      ) : (
        <textarea
          className={`ba-textarea${block.type === 'h3' ? ' ba-textarea--sm' : ''}`}
          value={block.value}
          onChange={field}
          rows={block.type === 'h3' ? 1 : block.type === 'pullquote' ? 3 : 5}
          placeholder={
            block.type === 'h3' ? 'Section heading text…' :
            block.type === 'pullquote' ? 'Pull quote text…' :
            'Paragraph text… (HTML like <strong>, <a href="…"> is supported)'
          }
        />
      )}
    </div>
  );
}

function Preview({ post }) {
  const { blogPosts } = { blogPosts: [post] };
  return (
    <div className="ba-preview">
      <p className="meta-text">{post.date}</p>
      <h1 className="post-title">{post.title || <em style={{ opacity: 0.35 }}>Untitled</em>}</h1>
      <article className="post-card">
        {post.content.map((p, i) =>
          /^<(h[1-6]|blockquote|ul|ol|div|p)\b/.test(p) ? (
            <div key={i} dangerouslySetInnerHTML={{ __html: p }} />
          ) : (
            <p key={i} className="post-paragraph" dangerouslySetInnerHTML={{ __html: p }} />
          )
        )}
        {post.content.length === 0 && <p className="post-paragraph" style={{ opacity: 0.4 }}>No content blocks yet.</p>}
      </article>
    </div>
  );
}

// ── main editor ───────────────────────────────────────────────────────────────

function BlogEditor() {
  const today = todayISO();

  const [tab, setTab] = useState('write');
  const [status, setStatus] = useState(null); // null | 'publishing' | 'success' | {error}

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Jake Sebahar');
  const [slugManual, setSlugManual] = useState(false);
  const [slug, setSlug] = useState('');
  const [publishedDate, setPublishedDate] = useState(today);
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [blocks, setBlocks] = useState([{ id: uid(), type: 'paragraph', value: '' }]);

  function handleTitle(e) {
    const val = e.target.value;
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  }

  function handleSlug(e) {
    setSlugManual(true);
    setSlug(slugify(e.target.value));
  }

  function addBlock(type = 'paragraph') {
    const base = type === 'olist'
      ? { id: uid(), type, value: '', items: [''] }
      : { id: uid(), type, value: '' };
    setBlocks(b => [...b, base]);
  }

  function updateBlock(id, updated) { setBlocks(b => b.map(x => x.id === id ? updated : x)); }
  function removeBlock(id) { setBlocks(b => b.filter(x => x.id !== id)); }
  function moveBlock(id, dir) {
    setBlocks(b => {
      const i = b.findIndex(x => x.id === id);
      if (i < 0) return b;
      const j = i + dir;
      if (j < 0 || j >= b.length) return b;
      const arr = [...b];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  const post = {
    slug: slug || slugify(title),
    title,
    author,
    date: formatDateLabel(publishedDate),
    publishedDate,
    excerpt,
    metaDescription: metaDescription || excerpt,
    keywords,
    content: blocks.map(blockToContent).filter(Boolean),
  };

  async function publish() {
    if (!title.trim()) { alert('Title is required.'); return; }
    if (!excerpt.trim()) { alert('Excerpt is required.'); return; }
    if (post.content.length === 0) { alert('Add at least one content block.'); return; }

    setStatus('publishing');
    try {
      await publishToGitHub(post);
      setStatus('success');
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  if (status === 'success') {
    return (
      <div className="ba-success">
        <p className="ba-success-icon">✓</p>
        <h2>Published!</h2>
        <p>The post was committed to the repo. Your deploy pipeline will pick it up in a minute or two.</p>
        <button className="ba-btn-primary" onClick={() => {
          setStatus(null); setTitle(''); setAuthor('Jake Sebahar'); setSlug(''); setSlugManual(false);
          setPublishedDate(today); setExcerpt(''); setMetaDescription('');
          setKeywords([]); setBlocks([{ id: uid(), type: 'paragraph', value: '' }]);
          setTab('write');
        }}>Write another post</button>
      </div>
    );
  }

  return (
    <div className="ba-editor">
      <div className="ba-editor-header">
        <p className="ba-logo">SEB<span>admin</span></p>
        <div className="ba-tabs">
          <button className={`ba-tab${tab === 'write' ? ' ba-tab--active' : ''}`} onClick={() => setTab('write')}>Write</button>
          <button className={`ba-tab${tab === 'preview' ? ' ba-tab--active' : ''}`} onClick={() => setTab('preview')}>Preview</button>
        </div>
        <button className="ba-btn-primary" onClick={publish} disabled={status === 'publishing'}>
          {status === 'publishing' ? 'Publishing…' : 'Publish Post →'}
        </button>
      </div>

      {status?.error && (
        <div className="ba-err-banner">Failed to publish: {status.error}</div>
      )}

      {tab === 'write' ? (
        <div className="ba-write">
          {/* ── Metadata ── */}
          <section className="ba-section">
            <h2 className="ba-section-title">Post Details</h2>

            <div className="ba-field">
              <label className="ba-label">Title <span className="ba-req">*</span></label>
              <input className="ba-input ba-input--lg" value={title} onChange={handleTitle} placeholder="Your post title…" />
            </div>

            <div className="ba-field">
              <label className="ba-label">Author</label>
              <input className="ba-input" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Jake Sebahar" />
            </div>

            <div className="ba-row">
              <div className="ba-field">
                <label className="ba-label">Slug</label>
                <input className="ba-input" value={slug} onChange={handleSlug} placeholder="auto-generated-from-title" />
              </div>
              <div className="ba-field">
                <label className="ba-label">Publish Date</label>
                <input className="ba-input" type="date" value={publishedDate} onChange={e => setPublishedDate(e.target.value)} />
              </div>
            </div>

            <div className="ba-field">
              <label className="ba-label">Excerpt <span className="ba-req">*</span></label>
              <textarea className="ba-textarea" rows={3} value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="One or two sentences shown on the blog card and home page." />
            </div>

            <div className="ba-field">
              <label className="ba-label">Meta Description <span className="ba-muted">(defaults to excerpt if blank)</span></label>
              <textarea className="ba-textarea" rows={2} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="SEO description — aim for 120–160 characters." />
            </div>

            <div className="ba-field">
              <label className="ba-label">Keywords</label>
              <KeywordInput keywords={keywords} setKeywords={setKeywords} />
              <p className="ba-hint">Press Enter or click a keyword to add it.</p>
            </div>
          </section>

          {/* ── Content ── */}
          <section className="ba-section">
            <h2 className="ba-section-title">Content</h2>
            <p className="ba-hint ba-hint--top">Build the post by stacking content blocks. Drag order with the arrows.</p>

            {blocks.map((block, i) => (
              <BlockEditor
                key={block.id}
                block={block}
                onChange={updated => updateBlock(block.id, updated)}
                onRemove={() => removeBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, -1)}
                onMoveDown={() => moveBlock(block.id, 1)}
                isFirst={i === 0}
                isLast={i === blocks.length - 1}
              />
            ))}

            <div className="ba-add-block">
              <span className="ba-add-label">Add block</span>
              <button type="button" className="ba-add-btn" onClick={() => addBlock('paragraph')}>¶ Paragraph</button>
              <button type="button" className="ba-add-btn" onClick={() => addBlock('h3')}>H3 Header</button>
              <button type="button" className="ba-add-btn" onClick={() => addBlock('pullquote')}>" Pull Quote</button>
              <button type="button" className="ba-add-btn" onClick={() => addBlock('olist')}>1. List</button>
            </div>
          </section>
        </div>
      ) : (
        <Preview post={post} />
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function BlogAdmin() {
  const [authed, setAuthed] = useState(false);

  if (!OWNER || !REPO || !TOKEN || !ADMIN_PASSWORD) {
    return (
      <div className="ba-gate">
        <p className="ba-gate-logo">SEB<span>admin</span></p>
        <div className="ba-config-warn">
          <p><strong>Missing environment variables.</strong></p>
          <p>Add these to your <code>.env.local</code> file:</p>
          <pre>{`VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=seb-fantasy
VITE_GITHUB_TOKEN=your-fine-grained-pat
VITE_ADMIN_PASSWORD=your-password`}</pre>
          <p>See <code>ADMIN_SETUP.md</code> in the project root for instructions.</p>
        </div>
      </div>
    );
  }

  return authed ? <BlogEditor /> : <PasswordGate onAuth={() => setAuthed(true)} />;
}
