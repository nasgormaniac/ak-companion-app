import { useEffect, useState } from 'react';
import cardCodeRule from '../shared/cardCode.json';
import imageRules from '../shared/imageRules.json';
import { cardCatalogue } from '../shared/links.json';
import { applyTheme, resolveTheme } from './theme.js';

const game = window.akScannerGame;
const cards = window.akScannerCards;
const categories = ['animal', 'strong', 'miracle'];
const rarities = ['common', 'bronze', 'silver', 'gold', 'ultra', 'kaiser'];
const types = ['speed', 'multi', 'heavy'];
const auras = ['none', 'shining', 'defense', 'burning', 'evil', 'forest', 'miracle'];
const effects = ['None', 'Slot Jammer', 'All Big', 'All Doubling', 'All Miracle', 'Lucky Chance', 'Lucky Break', 'All G', 'All T', 'All P', 'Resurrection', 'G Guard', 'T Guard', 'P Guard', 'Mystery Miracle'];
const validCode = new RegExp(cardCodeRule.pattern);
const codeError = (value) => validCode.test(value) ? '' : 'Use exactly 8 printable characters starting with bn.';
const title = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const filtersByCategory = {
  animal: [['rarity', 'Rarity', rarities], ['gold_attack', 'Gold attack', ['G', 'T', 'P']], ['type', 'Type', types]],
  strong: [['rarity', 'Rarity', rarities.slice(0, 4)], ['guts_level', 'Guts level', [1, 2, 3, 4, 5]], ['tech_level', 'Tech level', [1, 2, 3, 4, 5]], ['power_level', 'Power level', [1, 2, 3, 4, 5]], ['aura', 'Aura', auras]],
  miracle: [['rarity', 'Rarity', rarities.slice(0, 4)], ['effect', 'Effect', effects], ['type', 'Type', types]],
};
const emptyForm = (category) => ({ category, nama: '', rarity: 'common', card_code: '', gold_attack: 'G', card_type: 'speed', guts_level: 1, tech_level: 1, power_level: 1, aura: 'none', effect: 'None' });
function preferredTheme() { try { return resolveTheme(localStorage.getItem('ak-scanner-theme'), window.matchMedia('(prefers-color-scheme: dark)').matches); } catch { return 'light'; } }

function SelectField({ id, label, value, options, onChange, error, emptyLabel }) {
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}>
    {emptyLabel && <option value="">{emptyLabel}</option>}
    {options.map((option) => <option key={option} value={option}>{option === 'asc' ? 'Low to high' : option === 'desc' ? 'High to low' : typeof option === 'number' ? option : title(String(option))}</option>)}
  </select>{error && <span className="field-error" id={`${id}-error`}>{error}</span>}</div>;
}
function Feedback({ value, dismiss }) { return value && <div className={`feedback ${value.kind}`} role={value.kind === 'error' ? 'alert' : 'status'}><span>{value.message}</span><button type="button" onClick={dismiss} aria-label="Dismiss message">×</button></div>; }
function CardImage({ card }) {
  const [source, setSource] = useState('');
  useEffect(() => { let live = true; cards.image(card.image_path).then((response) => { if (live && response.ok) setSource(response.data); }).catch(() => {}); return () => { live = false; }; }, [card.image_path]);
  return source ? <img className="card-image" src={source} alt={card.nama} /> : <div className="card-image image-missing" role="img" aria-label={`Image unavailable for ${card.nama}`}>Image unavailable</div>;
}

function CardActionIcon({ kind }) {
  return kind === 'delete'
    ? <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
    : <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" /></svg>;
}

function CatalogueCard({ card, category, busyId, sending, game, setConfirmCard, openForm, useCard }) {
  const name = card.nama.length > 15 ? `${card.nama.slice(0, 12)}...` : card.nama;
  return <article className="catalogue-card" key={card.id}>
    <CardImage card={card} />
    <div className="card-content">
      <div className="card-title-row"><h2 title={card.nama}>{name}</h2><span className={`rarity rarity-${card.rarity}`}>{title(card.rarity)}</span></div>
      <div className="card-details"><div className="card-tags">
        {category === 'animal' && <><span className="gold-attack">{card.gold_attack}</span><span className="card-type">{title(card.card_type)}</span></>}
        {category === 'strong' && <span className="card-type">{title(card.aura)}</span>}
        {category === 'miracle' && <><span className="card-type">{card.effect}</span><span className="card-type">{title(card.card_type)}</span></>}
      </div><code className="barcode">{card.card_code}</code></div>
      <div className="card-actions"><div className="card-action-pair"><button className="delete-action" aria-label={`Delete ${card.nama}`} onClick={() => setConfirmCard(card)} disabled={busyId !== null}><CardActionIcon kind="delete" /></button><button className="edit-action" aria-label={`Edit ${card.nama}`} onClick={() => openForm(card.id)} disabled={busyId !== null}><CardActionIcon kind="edit" /></button></div><button className="use-action" onClick={() => useCard(card, category)} disabled={busyId !== null || sending || !game}>{sending ? 'Sending…' : 'Use'}</button></div>
    </div>
  </article>;
}

function Home({ openCategory }) {
  const [code, setCode] = useState(''); const [port, setPort] = useState('9876');
  const [scanError, setScanError] = useState('');
  const [message, setMessage] = useState(null); const [pending, setPending] = useState(false);
  useEffect(() => { if (game) game.getStatus().then((value) => setPort(String(value.port))).catch(() => setMessage({ kind: 'error', message: 'Could not read game settings.' })); }, []);
  async function send(event) { event.preventDefault(); if (!game || pending) return; const error = codeError(code); setScanError(error); if (error) return; setPending(true); setMessage(null); try { const result = await game.sendManual(code); setMessage({ kind: result.ok ? 'success' : 'error', message: result.message }); if (result.ok) { setCode(''); setScanError(''); } } catch { setMessage({ kind: 'error', message: 'The card could not be sent to the game.' }); } finally { setPending(false); } }
  async function savePort(event) { event.preventDefault(); if (!game) return; const numeric = Number(port); if (!/^[0-9]+$/.test(port) || !Number.isInteger(numeric) || numeric < 1 || numeric > 65535) { setMessage({ kind: 'error', message: 'Game port must be a whole number from 1 to 65535.' }); return; } try { const result = await game.setPort(numeric); setMessage({ kind: result.ok ? 'success' : 'error', message: result.ok ? 'Game port saved.' : result.message }); } catch { setMessage({ kind: 'error', message: 'Could not save the game port.' }); } }
  return <div className="home-shell"><div className="home-grid"><section className="scan-side"><h1>Animal Kaiser Scanner</h1><form onSubmit={send} noValidate><label htmlFor="scan-code">Card code</label><input id="scan-code" value={code} onChange={(event) => { setCode(event.target.value); if (scanError) setScanError(codeError(event.target.value)); }} onBlur={() => setScanError(codeError(code))} maxLength={8} autoComplete="off" spellCheck="false" aria-invalid={!!scanError} aria-describedby={scanError ? 'scan-code-error' : undefined} />{scanError && <span className="field-error" id="scan-code-error">{scanError}</span>}<button className="scan-button" disabled={pending || !game}>{pending ? 'Sending…' : 'Scan'}</button></form></section><nav className="home-menu" aria-label="Card catalogues">{categories.map((category) => <button key={category} className={`category-button ${category}`} onClick={() => openCategory(category)}>{title(category)}</button>)}</nav></div>
    <div className="home-bottom"><form className="port-form" onSubmit={savePort}><label htmlFor="game-port">Game port</label><input id="game-port" type="number" min="1" max="65535" value={port} onChange={(event) => setPort(event.target.value)} /><button disabled={!game}>Save</button></form><a className="card-catalogue-link" href={cardCatalogue} target="_blank" rel="noopener noreferrer">Card Catalogue</a></div><Feedback value={message} dismiss={() => setMessage(null)} /></div>;
}

function Catalogue({ category, goHome, openForm, useCard, sending, feedback, setFeedback }) {
  const [searchText, setSearchText] = useState(''); const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({}); const [raritySort, setRaritySort] = useState('');
  const [page, setPage] = useState(1); const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(false); const [version, setVersion] = useState(0);
  const [confirmCard, setConfirmCard] = useState(null); const [busyId, setBusyId] = useState(null);
  useEffect(() => { setSearch(''); setSearchText(''); setFilters({}); setRaritySort(''); setPage(1); }, [category]);
  useEffect(() => { let live = true; setLoading(true); setLoadError(false); if (!cards) { setLoading(false); setData({ items: [], total: 0 }); setLoadError(true); setFeedback({ kind: 'error', message: 'Open the desktop app to access the catalogue.' }); return undefined; }
    cards.list({ category, search, filters, raritySort: raritySort || null, page, pageSize: 6 }).then((response) => { if (!live) return; if (response.ok) { setData(response.data); setLoadError(false); } else { setData({ items: [], total: 0 }); setLoadError(true); setFeedback({ kind: 'error', message: response.message }); } }).catch(() => { if (live) { setData({ items: [], total: 0 }); setLoadError(true); setFeedback({ kind: 'error', message: 'Could not load the catalogue.' }); } }).finally(() => { if (live) setLoading(false); }); return () => { live = false; };
  }, [category, search, filters, raritySort, page, version]);
  function changeFilter(key, value) { setFilters((old) => { const next = { ...old }; if (value) next[key] = key.endsWith('_level') ? Number(value) : value; else delete next[key]; return next; }); setPage(1); }
  async function remove() { const card = confirmCard; setConfirmCard(null); setBusyId(card.id); try { const result = await cards.delete(card.id); if (!result.ok) setFeedback({ kind: 'error', message: result.message }); else { setFeedback({ kind: result.data.imageCleanupFailed ? 'warning' : 'success', message: result.data.imageCleanupFailed ? 'Card deleted, but its image could not be removed.' : `${card.nama} deleted.` }); if (page > 1 && data.items.length === 1) setPage(page - 1); else setVersion((value) => value + 1); } } catch { setFeedback({ kind: 'error', message: 'Could not delete the card.' }); } finally { setBusyId(null); } }
  const pages = Math.ceil(data.total / 6);
  return <div className={`catalogue category-${category}`}><header className="catalogue-header"><button className="text-back" onClick={goHome}>← Home</button><h1>{title(category)} Cards</h1><button className="add-button" onClick={() => openForm(null)}>+ Add</button></header>
    <form className="search-row" onSubmit={(event) => { event.preventDefault(); setSearch(searchText.trim()); setPage(1); }}><label className="sr-only" htmlFor="search-cards">Search by name</label><input id="search-cards" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search cards" /><button type="submit" aria-label="Search cards"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg></button></form>
    <div className="filter-controls">{filtersByCategory[category].map(([key, label, options]) => <SelectField key={key} id={`filter-${key}`} label={label} value={filters[key] ?? ''} options={options} emptyLabel="All" onChange={(value) => changeFilter(key, value)} />)}<SelectField id="rarity-sort" label="Sort by rarity" value={raritySort} options={['asc', 'desc']} emptyLabel="Newest first" onChange={(value) => { setRaritySort(value); setPage(1); }} /></div>
    <Feedback value={feedback} dismiss={() => setFeedback(null)} />
    {loading ? <div className="empty-state" role="status">Loading cards…</div> : loadError ? <div className="empty-state" role="alert">Could not load cards.<button onClick={() => setVersion((value) => value + 1)}>Retry</button></div> : data.items.length ? <div className="card-grid">{data.items.map((card) => <CatalogueCard key={card.id} card={card} category={category} busyId={busyId} sending={sending} game={game} setConfirmCard={setConfirmCard} openForm={openForm} useCard={useCard} />)}</div> : <div className="empty-state">{search || Object.keys(filters).length ? 'No cards match these filters.' : `No ${category} cards yet.`}{!search && !Object.keys(filters).length && <button onClick={() => openForm(null)}>Add a card</button>}</div>}
    {pages > 1 && <nav className="pagination" aria-label="Catalogue pages"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></nav>}
    {confirmCard && <div className="dialog-backdrop"><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" onKeyDown={(event) => { if (event.key === 'Escape') setConfirmCard(null); if (event.key === 'Tab') { const buttons = event.currentTarget.querySelectorAll('button'); if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[1].focus(); } else if (!event.shiftKey && document.activeElement === buttons[1]) { event.preventDefault(); buttons[0].focus(); } } }}><h2 id="delete-title">Delete card?</h2><p id="delete-description">Delete “{confirmCard.nama}” and its image?</p><div className="dialog-actions"><button autoFocus onClick={() => setConfirmCard(null)}>Cancel</button><button className="delete-action" onClick={remove}>Delete</button></div></div></div>}
  </div>;
}

function CardForm({ category, id, goBack, saved, setFeedback }) {
  const [form, setForm] = useState(emptyForm(category)); const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({}); const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(!!id); const [preview, setPreview] = useState('');
  useEffect(() => { if (!id) return; let live = true; cards.get(id).then((result) => { if (!live) return; if (!result.ok || result.data.category !== category) { setFeedback({ kind: 'error', message: result.message || 'Card not found.' }); goBack(); return; } setForm(result.data); cards.image(result.data.image_path).then((loaded) => { if (!live) return; if (loaded.ok) setPreview(loaded.data); else setFeedback({ kind: 'warning', message: loaded.message || 'Card image could not be loaded.' }); }).catch(() => { if (live) setFeedback({ kind: 'warning', message: 'Card image could not be loaded.' }); }); }).catch(() => { if (live) { setFeedback({ kind: 'error', message: 'Could not load the card.' }); goBack(); } }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [id, category]);
  function change(key, value) { setForm((old) => ({ ...old, [key]: value })); setErrors((old) => ({ ...old, [key]: undefined })); }
  function chooseImage(event) { const file = event.target.files?.[0] || null; setImage(file); setErrors((old) => ({ ...old, image: file && (!['image/png', 'image/jpeg'].includes(file.type) || file.size > imageRules.maxBytes) ? 'Choose a JPEG or PNG up to 1 MiB.' : undefined })); if (file) { const url = URL.createObjectURL(file); setPreview((old) => { if (old.startsWith('blob:')) URL.revokeObjectURL(old); return url; }); } }
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);
  async function submit(event) { event.preventDefault(); const next = {}; if (!form.nama.trim()) next.nama = 'Enter a card name.'; else if ([...form.nama.trim()].length > 255) next.nama = 'Name must be at most 255 characters.'; if (codeError(form.card_code)) next.card_code = codeError(form.card_code); if (!id && !image) next.image = 'Choose a card image.'; if (image && (!['image/png', 'image/jpeg'].includes(image.type) || image.size > imageRules.maxBytes)) next.image = 'Choose a JPEG or PNG up to 1 MiB.'; if (Object.keys(next).length) { setErrors(next); return; }
    setPending(true); setErrors({}); try { const imageData = image ? await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(image); }) : null;
      const { image_path, id: ignoredId, created_at, updated_at, ...values } = form; const payload = { ...values, guts_level: Number(values.guts_level), tech_level: Number(values.tech_level), power_level: Number(values.power_level) };
      if (category !== 'strong') { payload.guts_level = null; payload.tech_level = null; payload.power_level = null; payload.aura = null; } if (category !== 'animal') payload.gold_attack = null; if (category === 'strong') payload.card_type = null; if (category !== 'miracle') payload.effect = null; if (id) delete payload.category;
      const result = id ? await cards.update(id, payload, imageData) : await cards.create(payload, imageData); if (!result.ok) { setErrors(result.fieldErrors || {}); setFeedback({ kind: result.cleanupWarning || result.code === 'DUPLICATE_CODE' ? 'warning' : 'error', message: result.message }); return; } saved(result.data.imageCleanupFailed ? { kind: 'warning', message: 'Card updated, but its old image could not be removed. Cleanup will be retried on a later start.' } : { kind: 'success', message: id ? 'Card updated.' : 'Card added.' });
    } catch { setFeedback({ kind: 'error', message: 'Could not save the card.' }); } finally { setPending(false); }
  }
  if (loading) return <div className="form-shell">Loading card…</div>;
  return <div className={`form-shell category-${category}`}><form onSubmit={submit} className="card-form" noValidate><div className="form-heading"><button className="text-back" type="button" onClick={goBack}>← {title(category)}</button><h1>{id ? 'Edit' : 'Add'} {title(category)} Card</h1></div><div className="form-grid">
    <div className="field"><label htmlFor="name">Name</label><input id="name" value={form.nama} onChange={(event) => change('nama', event.target.value)} onBlur={() => { if (!form.nama.trim()) setErrors((old) => ({ ...old, nama: 'Enter a card name.' })); }} maxLength={255} aria-invalid={!!errors.nama} aria-describedby={errors.nama ? 'name-error' : undefined} />{errors.nama && <span className="field-error" id="name-error">{errors.nama}</span>}</div><SelectField id="rarity" label="Rarity" value={form.rarity} options={category === 'animal' ? rarities : rarities.slice(0, 4)} onChange={(value) => change('rarity', value)} error={errors.rarity} />
    {category === 'animal' && <><SelectField id="gold-attack" label="Gold attack" value={form.gold_attack} options={['G', 'T', 'P']} onChange={(value) => change('gold_attack', value)} error={errors.gold_attack} /><SelectField id="card-type" label="Type" value={form.card_type} options={types} onChange={(value) => change('card_type', value)} error={errors.card_type} /></>}
    {category === 'strong' && <><div className="strong-levels">{[['guts_level', 'Guts level'], ['tech_level', 'Tech level'], ['power_level', 'Power level']].map(([key, label]) => <SelectField key={key} id={key} label={label} value={form[key]} options={[1, 2, 3, 4, 5]} onChange={(value) => change(key, Number(value))} error={errors[key]} />)}</div><SelectField id="aura" label="Aura" value={form.aura} options={auras} onChange={(value) => change('aura', value)} error={errors.aura} /></>}
    {category === 'miracle' && <><SelectField id="effect" label="Effect" value={form.effect} options={effects} onChange={(value) => change('effect', value)} error={errors.effect} /><SelectField id="card-type" label="Type" value={form.card_type} options={types} onChange={(value) => change('card_type', value)} error={errors.card_type} /></>}
    <div className="field"><label htmlFor="form-code">Code</label><input id="form-code" value={form.card_code} onChange={(event) => { change('card_code', event.target.value); if (errors.card_code) setErrors((old) => ({ ...old, card_code: codeError(event.target.value) })); }} onBlur={() => setErrors((old) => ({ ...old, card_code: codeError(form.card_code) }))} maxLength={8} autoComplete="off" spellCheck="false" aria-invalid={!!errors.card_code} aria-describedby={errors.card_code ? 'form-code-error' : undefined} />{errors.card_code && <span className="field-error" id="form-code-error">{errors.card_code}</span>}</div><div className="field"><label htmlFor="image">Image</label><input id="image" type="file" accept="image/png,image/jpeg" onChange={chooseImage} aria-invalid={!!errors.image} aria-describedby={errors.image ? 'image-error' : undefined} />{errors.image && <span className="field-error" id="image-error">{errors.image}</span>}</div></div>
    {preview && <img className="form-preview" src={preview} alt="Selected card preview" />}<div className="form-actions"><button type="button" className="cancel-action" onClick={goBack}>Cancel</button><button className="save-action" disabled={pending || !cards}>{pending ? 'Saving…' : 'Save'}</button></div></form></div>;
}

export default function App() {
  const [view, setView] = useState({ name: 'home' }); const [theme, setTheme] = useState(preferredTheme); const [feedback, setFeedback] = useState(null); const [sending, setSending] = useState(false);
  useEffect(() => { applyTheme(document.documentElement, localStorage, theme); }, [theme]);
  function catalogue(category) { setFeedback(null); setView({ name: 'catalogue', category }); }
  function advance(category) { const next = categories[categories.indexOf(category) + 1]; if (next) catalogue(next); else setView({ name: 'home' }); }
  async function useAndAdvance(card, category) {
    if (sending || !game) return;
    setSending(true);
    setFeedback(null);
    advance(category);
    try {
      const result = await game.sendSaved(card.id);
      if (!result.ok) setFeedback({ kind: 'error', message: result.message });
    } catch {
      setFeedback({ kind: 'error', message: 'Could not send the saved card.' });
    } finally {
      setSending(false);
    }
  }
  return <main className="app-page"><div className="app-topbar"><img className="app-brand" src={`${import.meta.env.BASE_URL}app-icon.png`} alt="Animal Kaiser Companion" /><button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? '☾ Dark' : '☀ Light'}</button></div>
    {view.name === 'home' && <><Feedback value={feedback} dismiss={() => setFeedback(null)} /><Home openCategory={catalogue} /></>}
    {view.name === 'catalogue' && <Catalogue key={view.category} category={view.category} goHome={() => setView({ name: 'home' })} openForm={(id) => setView({ name: 'form', category: view.category, id })} useCard={useAndAdvance} sending={sending} feedback={feedback} setFeedback={setFeedback} />}
    {view.name === 'form' && <><Feedback value={feedback} dismiss={() => setFeedback(null)} /><CardForm category={view.category} id={view.id} goBack={() => setView({ name: 'catalogue', category: view.category })} setFeedback={setFeedback} saved={(value) => { setView({ name: 'catalogue', category: view.category }); setFeedback(value); }} /></>}
  </main>;
}
