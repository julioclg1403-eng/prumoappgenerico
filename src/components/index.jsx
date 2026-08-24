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
    <aside style={{ width: 220, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: 16, flex: 'none' }}>
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
