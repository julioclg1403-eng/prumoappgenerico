import { useState } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, ItemLista, Sheet, Campo, campoEstilo } from '../components'
import { formatarData } from '../lib/dominio'

const VAZIO = { nome: '', parent_id: '', data_inicio_prevista: '', data_fim_prevista: '', data_inicio_real: '', data_fim_real: '', percentual: 0 }

function nivel(itens, id, n = 0) {
  const item = itens.find((i) => i.id === id)
  if (!item?.parent_id) return n
  return nivel(itens, item.parent_id, n + 1)
}

export default function Cronograma() {
  const dados = useDados()
  const [editando, setEditando] = useState(null)

  const itens = [...dados.daObra.scheduleItems].sort((a, b) => a.ordem - b.ordem)

  const salvar = async () => {
    if (!editando.nome?.trim()) return
    await dados.salvarItemCronograma({
      ...editando, nome: editando.nome.trim(),
      data_inicio_prevista: editando.data_inicio_prevista || null,
      data_fim_prevista: editando.data_fim_prevista || null,
      data_inicio_real: editando.data_inicio_real || null,
      data_fim_real: editando.data_fim_real || null,
      percentual: Number(editando.percentual) || 0,
    })
    setEditando(null)
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Cronograma físico" />
      <div style={{ padding: 20 }}>
        <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={() => setEditando({ ...VAZIO })}>+ Novo item</button>
        <div className="stack-1">
          {itens.length === 0 && <div className="t-caption">Nenhum item lançado ainda.</div>}
          {itens.map((it) => {
            const atrasado = it.data_fim_prevista && it.percentual < 100 && it.data_fim_prevista < new Date().toISOString().slice(0, 10)
            return (
              <div key={it.id} style={{ marginLeft: nivel(itens, it.id) * 16 }}>
                <ItemLista
                  titulo={it.nome}
                  subtitulo={`Previsto: ${formatarData(it.data_inicio_prevista)} → ${formatarData(it.data_fim_prevista)} · ${it.percentual}%${atrasado ? ' · ATRASADO' : ''}`}
                  direita={<button className="btn btn-ghost btn-sm" onClick={() => dados.removerItemCronograma(it.id)}>Remover</button>}
                  onClick={() => setEditando({ ...it, parent_id: it.parent_id || '' })}
                />
              </div>
            )
          })}
        </div>
      </div>

      <Sheet
        aberto={Boolean(editando)} titulo={editando?.id ? 'Editar item' : 'Novo item do cronograma'} onFechar={() => setEditando(null)}
        rodape={<button className="btn btn-primary" style={{ width: '100%' }} onClick={salvar}>Salvar</button>}
      >
        {editando && (
          <>
            <Campo label="Nome">
              <input style={campoEstilo()} value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
            </Campo>
            <Campo label="Item pai (opcional, pra agrupar)">
              <select style={campoEstilo()} value={editando.parent_id} onChange={(e) => setEditando({ ...editando, parent_id: e.target.value })}>
                <option value="">— (item de topo)</option>
                {itens.filter((i) => i.id !== editando.id).map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </select>
            </Campo>
            <div className="row-flex" style={{ gap: 8 }}>
              <Campo label="Início previsto"><input type="date" style={campoEstilo()} value={editando.data_inicio_prevista || ''} onChange={(e) => setEditando({ ...editando, data_inicio_prevista: e.target.value })} /></Campo>
              <Campo label="Fim previsto"><input type="date" style={campoEstilo()} value={editando.data_fim_prevista || ''} onChange={(e) => setEditando({ ...editando, data_fim_prevista: e.target.value })} /></Campo>
            </div>
            <div className="row-flex" style={{ gap: 8 }}>
              <Campo label="Início real"><input type="date" style={campoEstilo()} value={editando.data_inicio_real || ''} onChange={(e) => setEditando({ ...editando, data_inicio_real: e.target.value })} /></Campo>
              <Campo label="Fim real"><input type="date" style={campoEstilo()} value={editando.data_fim_real || ''} onChange={(e) => setEditando({ ...editando, data_fim_real: e.target.value })} /></Campo>
            </div>
            <Campo label={`Percentual concluído (${editando.percentual}%)`}>
              <input
                type="range" min={0} max={100} style={{ width: '100%' }} value={editando.percentual}
                onChange={(e) => setEditando({ ...editando, percentual: e.target.value })}
              />
            </Campo>
          </>
        )}
      </Sheet>
    </div>
  )
}
