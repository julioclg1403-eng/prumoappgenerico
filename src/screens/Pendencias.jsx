import { useState, useMemo } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, Segmentos, ItemLista, Sheet, Campo, campoEstilo } from '../components'
import { formatarData, pendenciasEmAberto, pendenciasAtrasadas, ROTULO_PRIORIDADE } from '../lib/dominio'

const VAZIA = { titulo: '', descricao: '', prioridade: 'media', prazo: '' }

export default function Pendencias() {
  const dados = useDados()
  const [filtro, setFiltro] = useState('aberto')
  const [editando, setEditando] = useState(null)

  const filtros = [
    { valor: 'aberto', rotulo: 'Em aberto', contador: pendenciasEmAberto(dados.daObra.issues).length },
    { valor: 'atrasada', rotulo: 'Atrasadas', contador: pendenciasAtrasadas(dados.daObra.issues).length },
    { valor: 'resolvida', rotulo: 'Resolvidas' },
  ]

  const lista = useMemo(() => {
    if (filtro === 'atrasada') return pendenciasAtrasadas(dados.daObra.issues)
    if (filtro === 'resolvida') return dados.daObra.issues.filter((i) => i.status === 'resolvida')
    return pendenciasEmAberto(dados.daObra.issues)
  }, [dados.daObra.issues, filtro])

  const salvar = async () => {
    if (!editando.titulo?.trim()) return
    await dados.salvarPendencia({ ...editando, titulo: editando.titulo.trim(), prazo: editando.prazo || null })
    setEditando(null)
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Pendências" />
      <Segmentos opcoes={filtros} atual={filtro} onEscolher={setFiltro} />
      <div style={{ padding: 20 }}>
        <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={() => setEditando({ ...VAZIA })}>+ Nova pendência</button>
        <div className="stack-1">
          {lista.length === 0 && <div className="t-caption">Nada por aqui.</div>}
          {lista.map((p) => (
            <ItemLista
              key={p.id} titulo={p.titulo}
              subtitulo={`${ROTULO_PRIORIDADE[p.prioridade]}${p.prazo ? ` · prazo ${formatarData(p.prazo)}` : ''}`}
              direita={p.status === 'aberta'
                ? <button className="btn btn-ghost btn-sm" onClick={() => dados.mudarStatusPendencia(p.id, 'resolvida')}>Resolver</button>
                : <button className="btn btn-ghost btn-sm" onClick={() => dados.mudarStatusPendencia(p.id, 'aberta')}>Reabrir</button>}
            />
          ))}
        </div>
      </div>

      <Sheet
        aberto={Boolean(editando)} titulo="Nova pendência" onFechar={() => setEditando(null)}
        rodape={<button className="btn btn-primary" style={{ width: '100%' }} onClick={salvar}>Salvar</button>}
      >
        {editando && (
          <>
            <Campo label="Título">
              <input style={campoEstilo()} value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} />
            </Campo>
            <Campo label="Descrição">
              <textarea style={{ ...campoEstilo(), minHeight: 70 }} value={editando.descricao} onChange={(e) => setEditando({ ...editando, descricao: e.target.value })} />
            </Campo>
            <Campo label="Prioridade">
              <select style={campoEstilo()} value={editando.prioridade} onChange={(e) => setEditando({ ...editando, prioridade: e.target.value })}>
                {Object.entries(ROTULO_PRIORIDADE).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
            </Campo>
            <Campo label="Prazo">
              <input type="date" style={campoEstilo()} value={editando.prazo} onChange={(e) => setEditando({ ...editando, prazo: e.target.value })} />
            </Campo>
          </>
        )}
      </Sheet>
    </div>
  )
}
