import { useState } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, ItemLista, Sheet, Campo, campoEstilo } from '../components'
import { formatarData, hojeISO, ROTULO_SITUACAO_EQUIPAMENTO } from '../lib/dominio'

const VAZIO = { identificacao: '', tipo: '', fornecedor: '', situacao: 'ativo', local_atual: '', data_entrada: '', previsao_devolucao: '', observacao: '' }

export default function Equipamentos() {
  const dados = useDados()
  const [editando, setEditando] = useState(null)

  const salvar = async () => {
    if (!editando.identificacao?.trim()) return
    await dados.salvarEquipamento({
      ...editando, identificacao: editando.identificacao.trim(),
      data_entrada: editando.data_entrada || null, previsao_devolucao: editando.previsao_devolucao || null,
    })
    setEditando(null)
  }

  const hoje = hojeISO()

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Equipamentos" />
      <div style={{ padding: 20 }}>
        <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={() => setEditando({ ...VAZIO })}>+ Novo equipamento</button>
        <div className="stack-1">
          {dados.daObra.equipment.length === 0 && <div className="t-caption">Nenhum equipamento cadastrado.</div>}
          {dados.daObra.equipment.map((e) => {
            const vencido = e.previsao_devolucao && e.previsao_devolucao < hoje && e.situacao === 'ativo'
            const proximo = e.previsao_devolucao && !vencido && e.previsao_devolucao <= somarDias(hoje, 3)
            return (
              <ItemLista
                key={e.id} titulo={e.identificacao}
                subtitulo={`${ROTULO_SITUACAO_EQUIPAMENTO[e.situacao]}${e.local_atual ? ` · ${e.local_atual}` : ''}${e.previsao_devolucao ? ` · devolução ${formatarData(e.previsao_devolucao)}` : ''}${vencido ? ' · VENCIDO' : proximo ? ' · próximo' : ''}`}
                direita={<button className="btn btn-ghost btn-sm" onClick={() => dados.arquivarEquipamento(e.id)}>Arquivar</button>}
                onClick={() => setEditando({ ...e })}
              />
            )
          })}
        </div>
      </div>

      <Sheet
        aberto={Boolean(editando)} titulo={editando?.id ? 'Editar equipamento' : 'Novo equipamento'} onFechar={() => setEditando(null)}
        rodape={<button className="btn btn-primary" style={{ width: '100%' }} onClick={salvar}>Salvar</button>}
      >
        {editando && (
          <>
            <Campo label="Identificação">
              <input style={campoEstilo()} value={editando.identificacao} onChange={(e) => setEditando({ ...editando, identificacao: e.target.value })} />
            </Campo>
            <Campo label="Tipo"><input style={campoEstilo()} value={editando.tipo || ''} onChange={(e) => setEditando({ ...editando, tipo: e.target.value })} /></Campo>
            <Campo label="Fornecedor/proprietário"><input style={campoEstilo()} value={editando.fornecedor || ''} onChange={(e) => setEditando({ ...editando, fornecedor: e.target.value })} /></Campo>
            <Campo label="Situação">
              <select style={campoEstilo()} value={editando.situacao} onChange={(e) => setEditando({ ...editando, situacao: e.target.value })}>
                {Object.entries(ROTULO_SITUACAO_EQUIPAMENTO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
            </Campo>
            <Campo label="Local atual"><input style={campoEstilo()} value={editando.local_atual || ''} onChange={(e) => setEditando({ ...editando, local_atual: e.target.value })} /></Campo>
            <div className="row-flex" style={{ gap: 8 }}>
              <Campo label="Entrada"><input type="date" style={campoEstilo()} value={editando.data_entrada || ''} onChange={(e) => setEditando({ ...editando, data_entrada: e.target.value })} /></Campo>
              <Campo label="Previsão de devolução"><input type="date" style={campoEstilo()} value={editando.previsao_devolucao || ''} onChange={(e) => setEditando({ ...editando, previsao_devolucao: e.target.value })} /></Campo>
            </div>
            <Campo label="Observação">
              <textarea style={{ ...campoEstilo(), minHeight: 60 }} value={editando.observacao || ''} onChange={(e) => setEditando({ ...editando, observacao: e.target.value })} />
            </Campo>
          </>
        )}
      </Sheet>
    </div>
  )
}

function somarDias(iso, dias) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}
