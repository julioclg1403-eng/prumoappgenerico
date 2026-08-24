import { supabase } from '../lib/supabase'

export function PageHeader({ titulo, subtitulo }) {
  return (
    <div style={{ padding: '20px 20px 8px' }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>{titulo}</h1>
      {subtitulo && <div className="t-caption">{subtitulo}</div>}
    </div>
  )
}

export function BottomNav({ itens, atual, onSelecionar }) {
  return (
    <nav
      className="app-bottomnav"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)',
        borderTop: '1px solid var(--border)', display: 'flex', padding: '6px 0',
      }}
    >
      {itens.map((it) => (
        <button
          key={it.chave} onClick={() => onSelecionar(it.chave)}
          className="btn-ghost"
          style={{
            flex: 1, border: 'none', background: 'transparent', padding: '8px 4px',
            color: atual === it.chave ? 'var(--brand)' : 'var(--text-3)',
            fontWeight: atual === it.chave ? 700 : 500, fontSize: 12, cursor: 'pointer',
          }}
        >
          {it.rotulo}
        </button>
      ))}
    </nav>
  )
}

export function Sidebar({ itens, atual, onSelecionar, perfil }) {
  return (
    <aside className="app-sidebar" style={{ width: 220, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: 16, flex: 'none' }}>
      <div style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 20, marginBottom: 20 }}>Canteiro</div>
      <div className="stack-1">
        {itens.map((it) => (
          <button
            key={it.chave} onClick={() => onSelecionar(it.chave)}
            className="btn"
            style={{
              width: '100%', justifyContent: 'flex-start', background: atual === it.chave ? 'var(--brand)' : 'transparent',
              color: atual === it.chave ? '#fff' : 'var(--text-1)',
            }}
          >
            {it.rotulo}
          </button>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 16, width: 188 }}>
        <div className="t-caption t-strong">{perfil?.nome || perfil?.email}</div>
        <button className="btn btn-ghost" style={{ padding: 0, fontSize: 12 }} onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </div>
    </aside>
  )
}

export function Segmentos({ opcoes, atual, onEscolher }) {
  return (
    <div className="row-flex" style={{ gap: 6, flexWrap: 'wrap', padding: '0 20px' }}>
      {opcoes.map((op) => (
        <button
          key={op.valor} onClick={() => onEscolher(op.valor)}
          className="btn btn-sm"
          style={{
            background: atual === op.valor ? 'var(--brand)' : 'var(--surface)',
            color: atual === op.valor ? '#fff' : 'var(--text-1)',
            border: '1px solid var(--border)', padding: '6px 12px', fontSize: 13,
          }}
        >
          {op.rotulo}{op.contador !== undefined ? ` (${op.contador})` : ''}
        </button>
      ))}
    </div>
  )
}

export function Sheet({ aberto, titulo, onFechar, children, rodape }) {
  if (!aberto) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(16,18,22,.4)', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center', zIndex: 50,
      }}
      onClick={onFechar}
    >
      <div
        className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', margin: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row-between" style={{ marginBottom: 12 }}>
          <div className="t-strong" style={{ fontSize: 17 }}>{titulo}</div>
          <button className="btn btn-ghost" onClick={onFechar} style={{ padding: 4 }}>✕</button>
        </div>
        <div className="stack-2">{children}</div>
        {rodape && <div style={{ marginTop: 16 }}>{rodape}</div>}
      </div>
    </div>
  )
}

export function Campo({ label, dica, children }) {
  return (
    <label className="stack-1" style={{ display: 'block' }}>
      <span className="t-caption t-strong">{label}</span>
      {children}
      {dica && <span className="t-caption">{dica}</span>}
    </label>
  )
}

export function campoEstilo() {
  return { padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%' }
}

export function ItemLista({ titulo, subtitulo, direita, onClick }) {
  return (
    <div
      className="card row-between" onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', padding: 12 }}
    >
      <div>
        <div className="t-strong" style={{ fontSize: 14 }}>{titulo}</div>
        {subtitulo && <div className="t-caption">{subtitulo}</div>}
      </div>
      {direita}
    </div>
  )
}

/* Toda ação que falha (erro do Supabase, regra de negócio bloqueando
   como o ciclo de dependências) passa por aqui — sem isso, a pessoa
   clica, nada muda na tela, e não sabe se funcionou ou não. */
export function ErroBanner({ erro, onFechar }) {
  if (!erro) return null
  return (
    <div
      className="app-erro-banner"
      style={{
        position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
        background: 'var(--danger)', color: '#fff', padding: '10px 16px', borderRadius: 10,
        maxWidth: '90vw', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <span style={{ fontSize: 13 }}>{erro}</span>
      <button onClick={onFechar} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>✕</button>
    </div>
  )
}

export function Confirmar({ aberto, titulo, texto, rotuloOk = 'Confirmar', onOk, onCancelar }) {
  if (!aberto) return null
  return (
    <Sheet aberto titulo={titulo} onFechar={onCancelar}>
      <p className="t-caption">{texto}</p>
      <div className="row-flex" style={{ gap: 8 }}>
        <button className="btn btn-secondary grow" style={{ flex: 1 }} onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-primary grow" style={{ flex: 1 }} onClick={onOk}>{rotuloOk}</button>
      </div>
    </Sheet>
  )
}
