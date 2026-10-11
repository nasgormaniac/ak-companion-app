import { useEffect, useState } from 'react';

const sets = window.akScannerCardSets;
const cards = window.akScannerCards;
const title = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const categories = ['animal', 'strong', 'miracle'];
const rarities = ['common', 'bronze', 'silver', 'gold', 'ultra', 'kaiser'];
const types = ['speed', 'multi', 'heavy'];
const auras = ['none', 'shining', 'defense', 'burning', 'evil', 'forest', 'miracle'];
const effects = ['None', 'Slot Jammer', 'All Big', 'All Doubling', 'All Miracle', 'Lucky Chance', 'Lucky Break', 'All G', 'All T', 'All P', 'Resurrection', 'G Guard', 'T Guard', 'P Guard', 'Mystery Miracle'];
const filtersByCategory = {
  animal: [['rarity', 'Rarity', rarities], ['gold_attack', 'Gold attack', ['G', 'T', 'P']], ['type', 'Type', types]],
  strong: [['rarity', 'Rarity', rarities.slice(0, 4)], ['guts_level', 'Guts level', [1, 2, 3, 4, 5]], ['tech_level', 'Tech level', [1, 2, 3, 4, 5]], ['power_level', 'Power level', [1, 2, 3, 4, 5]], ['aura', 'Aura', auras]],
  miracle: [['rarity', 'Rarity', rarities.slice(0, 4)], ['effect', 'Effect', effects], ['type', 'Type', types]],
};

function PickerFilter({ id, label, value, options, onChange }) {
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)}><option value="">All</option>{options.map((option) => <option key={option} value={option}>{typeof option === 'number' ? option : title(String(option))}</option>)}</select></div>;
}

export function CardSetIcon() {
  return <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="m12 7 3.5 5-3.5 5-3.5-5L12 7Z" /><path d="m8 5 .8 1L8 7l-.8-1L8 5Zm8 12 .8 1-.8 1-.8-1L16 17Z" /></svg>;
}

function CategoryIcon({ category }) {
  const shapes = {
    animal: <><path d="M7 13c-2 2-1 6 2 6 1 0 2-.7 3-.7s2 .7 3 .7c3 0 4-4 2-6-1.5-1.6-3-3-5-3s-3.5 1.4-5 3Z" /><circle cx="5" cy="8" r="1.3" /><circle cx="10" cy="6" r="1.3" /><circle cx="16" cy="6" r="1.3" /><circle cx="20" cy="8" r="1.3" /></>,
    strong: <path d="m13 2-9 11h7l-1 9 10-12h-7Z" />,
    miracle: <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z" />,
  };
  return <svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[category]}</svg>;
}

function HomeIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-6h6v6" /></svg>; }
function BackIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /><path d="M7 12h14" /></svg>; }

function ActionIcon({ kind }) {
  return kind === 'delete'
    ? <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
    : <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" /></svg>;
}

function SavedImage({ card, className = 'set-image' }) {
  const [source, setSource] = useState('');
  useEffect(() => {
    let live = true;
    setSource('');
    if (cards && card) cards.image(card.image_path).then((result) => { if (live && result.ok) setSource(result.data); }).catch(() => {});
    return () => { live = false; };
  }, [card?.image_path]);
  return source
    ? <img className={className} src={source} alt={card.nama} />
    : <div className={`${className} image-missing`} role="img" aria-label={`Image unavailable for ${card?.nama || 'card'}`}>Image unavailable</div>;
}

function SetCard({ item, busy, sending, edit, remove, use }) {
  return <article className="catalogue-card set-card">
    <SavedImage card={item.animal} />
    <div className="set-content">
      <h2 title={`${item.animal.nama} Card Set`}><span className="set-title-animal">{item.animal.nama}</span><span className="set-title-suffix"> Card Set</span></h2>
      {categories.map((category) => <div key={category} className="set-name"><span className={`set-icon ${category}`}><CategoryIcon category={category} /></span><span title={item[category].nama}>{item[category].nama}</span></div>)}
      <div className="card-actions"><div className="card-action-pair"><button className="delete-action" aria-label={`Delete ${item.animal.nama} Card Set`} onClick={() => remove(item)} disabled={busy}><ActionIcon kind="delete" /></button><button className="edit-action" aria-label={`Edit ${item.animal.nama} Card Set`} onClick={() => edit(item)} disabled={busy}><ActionIcon kind="edit" /></button></div><button className="use-action" onClick={() => use(item)} disabled={busy}>{sending ? 'Sending…' : 'Use'}</button></div>
    </div>
  </article>;
}

function Pager({ page, total, pageSize, onPage, label }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter((number) => number === 1 || number === pages || Math.abs(number - page) <= 1 || (page <= 2 && number <= 3) || (page >= pages - 1 && number >= pages - 2));
  return <nav className="pagination" aria-label={label}><button disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>{visible.map((number, index) => <span key={number} className="page-part">{index > 0 && number - visible[index - 1] > 1 && <span className="page-ellipsis" aria-hidden="true">…</span>}<button className={number === page ? 'active' : ''} aria-label={`Page ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onPage(number)}>{number}</button></span>)}<button disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></nav>;
}

export function CardSetCatalogue({ goHome, add, edit, use, sending, feedback, setFeedback, status }) {
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [version, setVersion] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(null), feedback.kind === 'success' ? 6000 : 8000);
    return () => clearTimeout(timer);
  }, [feedback, setFeedback]);
  useEffect(() => {
    const nextSearch = searchText.trim();
    if (nextSearch === search) return undefined;
    const timer = setTimeout(() => { setSearch(nextSearch); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [searchText, search]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    if (!sets) { setLoading(false); setLoadError(true); return undefined; }
    sets.list({ search, page, pageSize: 6 }).then((result) => {
      if (!live) return;
      if (result.ok) { setData(result.data); setLoadError(false); }
      else { setLoadError(true); setFeedback({ kind: 'error', message: result.message }); }
    }).catch(() => { if (live) { setLoadError(true); setFeedback({ kind: 'error', message: 'Could not load Card Sets.' }); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [search, page, version]);
  async function remove() {
    const item = confirm;
    setConfirm(null);
    setDeleting(true);
    try {
      const result = await sets.delete(item.id);
      if (!result.ok) setFeedback({ kind: 'error', message: result.message });
      else { setFeedback({ kind: 'success', message: 'Card Set deleted.' }); if (page > 1 && data.items.length === 1) setPage(page - 1); else setVersion((value) => value + 1); }
    } catch { setFeedback({ kind: 'error', message: 'Could not delete the Card Set.' }); }
    finally { setDeleting(false); }
  }
  return <div className="catalogue set-catalogue"><header className="catalogue-header"><button className="text-back" onClick={goHome} disabled={sending || deleting}><HomeIcon />Home</button><h1><span className="catalogue-heading-icon"><CardSetIcon /></span>Card Sets</h1><button className="add-button" onClick={add} disabled={sending || deleting}>+ Add</button></header>
    <div className="search-row"><label className="sr-only" htmlFor="search-card-sets">Search Card Sets</label><div className="search-field"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input id="search-card-sets" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search cards" /></div></div>
    {feedback && <div className={`feedback ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}><span>{feedback.message}</span><button onClick={() => setFeedback(null)} aria-label="Dismiss message">×</button></div>}
    {status && <p className="set-send-status" role="status">{status}</p>}
    {loading ? <div className="empty-state" role="status">Loading Card Sets…</div> : loadError ? <div className="empty-state" role="alert">Could not load Card Sets.<button onClick={() => setVersion((value) => value + 1)}>Retry</button></div> : data.items.length ? <div className="set-grid">{data.items.map((item) => <SetCard key={item.id} item={item} busy={sending || deleting} sending={sending} edit={edit} remove={setConfirm} use={use} />)}</div> : <div className="empty-state">{search ? 'No Card Sets match this search.' : 'No Card Sets yet.'}{!search && <button onClick={add}>Add a Card Set</button>}</div>}
    <Pager page={page} total={data.total} pageSize={6} onPage={setPage} label="Card Set pages" />
    {confirm && <div className="dialog-backdrop"><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-set-title" onKeyDown={(event) => { if (event.key === 'Escape') setConfirm(null); if (event.key === 'Tab') { const buttons = event.currentTarget.querySelectorAll('button'); if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[1].focus(); } else if (!event.shiftKey && document.activeElement === buttons[1]) { event.preventDefault(); buttons[0].focus(); } } }}><h2 id="delete-set-title">Delete “{confirm.animal.nama} Card Set”?</h2><div className="dialog-actions"><button autoFocus onClick={() => setConfirm(null)}>Cancel</button><button className="delete-action" onClick={remove}>Delete</button></div></div></div>}
  </div>;
}

export function CardSetForm({ draft, editingId, choose, cancel, saved, setFeedback }) {
  const [pending, setPending] = useState(false);
  const complete = categories.every((category) => draft[category]?.id);
  async function submit(event) {
    event.preventDefault();
    if (!complete || !sets || pending) return;
    setPending(true);
    const input = { animal_card_id: draft.animal.id, strong_card_id: draft.strong.id, miracle_card_id: draft.miracle.id };
    try {
      const result = editingId ? await sets.update(editingId, input) : await sets.create(input);
      if (!result.ok) setFeedback({ kind: result.code === 'DUPLICATE_SET' ? 'warning' : 'error', message: result.message });
      else saved({ kind: 'success', message: editingId ? 'Card Set updated.' : 'Card Set added.' });
    } catch { setFeedback({ kind: 'error', message: 'Could not save the Card Set.' }); }
    finally { setPending(false); }
  }
  return <div className="set-form"><form className="set-form-panel" onSubmit={submit}><div className="set-form-heading"><h1>{editingId ? 'Edit' : 'Add'} Card Set</h1><button type="button" className="set-form-back" onClick={cancel}><BackIcon />Card Sets</button></div><div className="slot-grid">
    {categories.map((category) => <button key={category} type="button" className="slot-card" onClick={() => choose(category)} disabled={pending}>
      {draft[category] ? <SavedImage card={draft[category]} /> : <div className={`slot-empty-image ${category}`}>{title(category)} card</div>}
      <div className="slot-body"><span className="slot-label">{title(category)}</span><strong>{draft[category] ? <><span className={`set-icon ${category}`}><CategoryIcon category={category} /></span><span className="slot-name" title={draft[category].nama}>{draft[category].nama}</span></> : 'No card selected'}</strong><em>{draft[category] ? 'Change' : 'Select'} {title(category)} →</em></div>
    </button>)}
  </div><div className="set-form-actions"><button type="button" className="cancel" onClick={cancel} disabled={pending}>Cancel</button><button className="save" disabled={!complete || pending || !sets}>{pending ? 'Saving…' : 'Save Card Set'}</button></div></form></div>;
}

export function CardSetPicker({ category, back, select, setFeedback }) {
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const nextSearch = searchText.trim();
    if (nextSearch === search) return undefined;
    const timer = setTimeout(() => { setSearch(nextSearch); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [searchText, search]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    if (!cards) { setLoading(false); setLoadError(true); return undefined; }
    cards.list({ category, search, filters, page, pageSize: 6 }).then((result) => {
      if (!live) return;
      if (result.ok) { setData(result.data); setLoadError(false); }
      else { setLoadError(true); setFeedback({ kind: 'error', message: result.message }); }
    }).catch(() => { if (live) { setLoadError(true); setFeedback({ kind: 'error', message: 'Could not load cards.' }); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [category, search, filters, page, version]);
  function changeFilter(key, value) {
    setFilters((current) => {
      const next = { ...current };
      if (value) next[key] = key.endsWith('_level') ? Number(value) : value;
      else delete next[key];
      return next;
    });
    setPage(1);
  }
  return <div className={`catalogue category-${category} picker-catalogue`}><header className="catalogue-header"><button className="text-back" onClick={back}><BackIcon />Back to set</button><h1><span className="catalogue-heading-icon"><CategoryIcon category={category} /></span>Choose {title(category)}</h1><span aria-hidden="true" /></header>
    <div className="search-row"><label className="sr-only" htmlFor="search-picker">Search cards</label><div className="search-field"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input id="search-picker" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search cards" /></div></div>
    <div className="filter-controls">{filtersByCategory[category].map(([key, label, options]) => <PickerFilter key={key} id={`picker-filter-${key}`} label={label} value={filters[key] ?? ''} options={options} onChange={(value) => changeFilter(key, value)} />)}</div>
    {loading ? <div className="empty-state" role="status">Loading cards…</div> : loadError ? <div className="empty-state" role="alert">Could not load cards.<button onClick={() => setVersion((value) => value + 1)}>Retry</button></div> : data.items.length ? <div className="card-grid">{data.items.map((card) => <article key={card.id} className={`catalogue-card category-${category}`}><SavedImage card={card} className="card-image" /><div className="card-content"><div className="card-title-row"><h2 title={card.nama}>{card.nama.length > 15 ? `${card.nama.slice(0, 12)}...` : card.nama}</h2><span className={`rarity rarity-${card.rarity}`}>{title(card.rarity)}</span></div><div className="card-details"><div className="card-tags">{category === 'animal' && <><span className="gold-attack">{card.gold_attack}</span><span className="card-type">{title(card.card_type)}</span></>}{category === 'strong' && <span className="card-type">{title(card.aura)}</span>}{category === 'miracle' && <><span className="card-type">{card.effect}</span><span className="card-type">{title(card.card_type)}</span></>}</div><code className="barcode">{card.card_code}</code></div><div className="picker-card-action"><button onClick={() => select(card)}>Select</button></div></div></article>)}</div> : <div className="empty-state">{search || Object.keys(filters).length ? 'No cards match these filters.' : `No ${category} cards yet.`}</div>}
    <Pager page={page} total={data.total} pageSize={6} onPage={setPage} label={`${title(category)} picker pages`} />
  </div>;
}
