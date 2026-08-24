import { useState } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, ItemLista, Sheet, Campo, campoEstilo } from '../components'
import { formatarData, hojeISO, ROTULO_STATUS_ATIVIDADE } from '../lib/dominio'

function diarioVazio(data) {
  return { data, clima: '', observacao: '', status: 'rascunho', presencas: [], atividades: [], ocorrencias: [] }
}

export default function Diario() {
  const dados = useDados()
  const [editando, setEditando] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const lista = [...dados.daObra.dailyReports].sort((a, b) => (a.data < b.data ? 1 : -1))

  const abrirNovo = () => setEditando(diarioVazio(hojeISO()))
  const abrirExistente = (d) => setEditando({
    ...d,
    presencas: d.presencas.map((p) => ({ worker_id: p.worker_id, company_id: p.company_id })),
  })

  const salvar = async (status) => {
    setSalvando(true)
    await dados.salvarDiario({ ...editando, status: status || editando.status })
    setSalvando(false)
    setEditando(null)
  }

  const presente = (workerId) => editando.presencas.some((p) => p.worker_id === workerId)
  const alternarPresenca = (worker) => {
    setEditando((p) => ({
      ...p,
      presencas: presente(worker.id)
        ? p.presencas.filter((x) => x.worker_id !== worker.id)
        : [...p.presencas, { worker_id: worker.id, company_id: worker.company_id }],
    }))
  }

  const adicionarAtividade = () => setEditando((p) => ({
    ...p, atividades: [...p.atividades, { service_id: '', location_id: '', status: 'nao_iniciada', observacao: '', equipe: [] }],
  }))
  const atualizarAtividade = (i, campos) => setEditando((p) => ({
    ...p, atividades: p.atividades.map((a, idx) => (idx === i ? { ...a, ...campos } : a)),
  }))
  const removerAtividade = (i) => setEditando((p) => ({ ...p, atividades: p.atividades.filter((_, idx) => idx !== i) }))
  const alternarEquipe = (i, workerId) => setEditando((p) => ({
    ...p,
    atividades: p.atividades.map((a, idx) => (idx !== i ? a : {
      ...a, equipe: a.equipe.includes(workerId) ? a.equipe.filter((w) => w !== workerId) : [...a.equipe, workerId],
    })),
  }))

  const adicionarOcorrencia = () => setEditando((p) => ({ ...p, ocorrencias: [...p.ocorrencias, { tipo_id: '', descricao: '' }] }))
  const atualizarOcorrencia = (i, campos) => setEditando((p) => ({
    ...p, ocorrencias: p.ocorrencias.map((o, idx) => (idx === i ? { ...o, ...campos } : o)),
  }))
  const removerOcorrencia = (i) => setEditando((p) => ({ ...p, ocorrencias: p.ocorrencias.filter((_, idx) => idx !== i) }))

  const presentes = editando ? dados.daObra.workers.filter((w) => presente(w.id)) : []

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Diário de obra" />
      <div style={{ padding: 20 }}>
        <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={abrirNovo}>+ Novo diário</button>
        <div className="stack-1">
          {lista.length === 0 && <div className="t-caption">Nenhum diário lançado ainda.</div>}
          {lista.map((d) => (
            <ItemLista
              key={d.id} titulo={formatarData(d.data)}
              subtitulo={`${d.status === 'concluido' ? 'Concluído' : 'Rascunho'} · ${d.presencas.length} presente(s) · ${d.atividades.length} atividade(s)`}
              onClick={() => abrirExistente(d)}
            />
          ))}
        </div>
      </div>

      <Sheet
        aberto={Boolean(editando)} titulo={`Diário — ${editando ? formatarData(editando.data) : ''}`} onFechar={() => setEditando(null)}
        rodape={
          <div className="row-flex" style={{ gap: 8 }}>
            <button className="btn btn-secondary grow" disabled={salvando} onClick={() => salvar('rascunho')}>Salvar rascunho</button>
            <button className="btn btn-primary grow" disabled={salvando} onClick={() => salvar('concluido')}>Concluir</button>
          </div>
        }
      >
        {editando && (
          <>
            <Campo label="Data">
              <input
                type="date" style={campoEstilo()} value={editando.data} disabled={Boolean(editando.id)}
                onChange={(e) => setEditando({ ...editando, data: e.target.value })}
              />
            </Campo>
            <Campo label="Clima">
              <input style={campoEstilo()} value={editando.clima || ''} onChange={(e) => setEditando({ ...editando, clima: e.target.value })} />
            </Campo>

            <div>
              <div className="t-caption t-strong" style={{ marginBottom: 6 }}>Presenças</div>
              <div className="stack-1">
                {dados.daObra.workers.length === 0 && <div className="t-caption">Cadastre colaboradores primeiro.</div>}
                {dados.daObra.workers.map((w) => (
                  <label key={w.id} className="row-flex card" style={{ gap: 8, padding: 10 }}>
                    <input type="checkbox" checked={presente(w.id)} onChange={() => alternarPresenca(w)} />
                    <span>{w.nome}{w.funcao ? ` · ${w.funcao}` : ''}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="row-between" style={{ marginBottom: 6 }}>
                <span className="t-caption t-strong">Frentes de serviço</span>
                <button className="btn btn-ghost btn-sm" onClick={adicionarAtividade}>+ Adicionar</button>
              </div>
              <div className="stack-1">
                {editando.atividades.map((a, i) => (
                  <div key={i} className="card stack-1">
                    <select style={campoEstilo()} value={a.service_id} onChange={(e) => atualizarAtividade(i, { service_id: e.target.value })}>
                      <option value="">Serviço…</option>
                      {dados.daObra.services.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                    <select style={campoEstilo()} value={a.location_id} onChange={(e) => atualizarAtividade(i, { location_id: e.target.value })}>
                      <option value="">Local…</option>
                      {dados.daObra.locations.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                    </select>
                    <select style={campoEstilo()} value={a.status} onChange={(e) => atualizarAtividade(i, { status: e.target.value })}>
                      {Object.entries(ROTULO_STATUS_ATIVIDADE).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                    </select>
                    {presentes.length > 0 && (
                      <div className="t-caption">
                        Equipe:{' '}
                        {presentes.map((w) => (
                          <label key={w.id} style={{ marginRight: 10 }}>
                            <input type="checkbox" checked={a.equipe.includes(w.id)} onChange={() => alternarEquipe(i, w.id)} /> {w.nome}
                          </label>
                        ))}
                      </div>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => removerAtividade(i)}>Remover frente</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="row-between" style={{ marginBottom: 6 }}>
                <span className="t-caption t-strong">Ocorrências</span>
                <button className="btn btn-ghost btn-sm" onClick={adicionarOcorrencia}>+ Adicionar</button>
              </div>
              <div className="stack-1">
                {editando.ocorrencias.map((o, i) => (
                  <div key={i} className="card stack-1">
                    <select style={campoEstilo()} value={o.tipo_id} onChange={(e) => atualizarOcorrencia(i, { tipo_id: e.target.value })}>
                      <option value="">Tipo…</option>
                      {dados.daObra.occurrenceTypes.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                    <textarea
                      style={{ ...campoEstilo(), minHeight: 60 }} placeholder="Descrição"
                      value={o.descricao} onChange={(e) => atualizarOcorrencia(i, { descricao: e.target.value })}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() => removerOcorrencia(i)}>Remover</button>
                  </div>
                ))}
              </div>
            </div>

            <Campo label="Observação geral">
              <textarea style={{ ...campoEstilo(), minHeight: 60 }} value={editando.observacao || ''} onChange={(e) => setEditando({ ...editando, observacao: e.target.value })} />
            </Campo>
          </>
        )}
      </Sheet>
    </div>
  )
}
