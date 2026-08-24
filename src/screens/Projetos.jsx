import { useState } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, Segmentos, ItemLista, Sheet, Campo, campoEstilo } from '../components'
import {
  formatarData, ROTULO_STATUS_PROJETO,
  projetoAtrasado, projetoSemPrazo, projetoAguardandoDependencia, simularAtraso,
} from '../lib/dominio'

const VAZIO = { titulo: '', disciplina: '', etapa: '', responsavel: '', data_prevista: '', status: 'nao_iniciado', observacoes: '' }

function sinalizar(p, projetos) {
  if (p.status === 'recebido') return null
  if (projetoAtrasado(p)) return { texto: 'Atrasado', cor: 'var(--danger)' }
  if (projetoAguardandoDependencia(p, projetos)) return { texto: 'Aguardando dependência', cor: 'var(--warning)' }
  if (projetoSemPrazo(p)) return { texto: 'Sem prazo', cor: 'var(--text-3)' }
  return null
}

export default function Projetos() {
  const dados = useDados()
  const projetos = dados.daObra.projects
  const [aba, setAba] = useState(null) // id do projeto aberto, ou 'novo'
  const [editando, setEditando] = useState(null)
  const [novaDependencia, setNovaDependencia] = useState('')
  const [novaNota, setNovaNota] = useState('')
  const [simulacao, setSimulacao] = useState(null) // { projectId, dias, resultado }

  const abrir = (p) => { setAba(p.id); setEditando({ ...p }) }
  const abrirNovo = () => { setAba('novo'); setEditando({ ...VAZIO }) }
  const fechar = () => { setAba(null); setEditando(null); setNovaDependencia(''); setNovaNota('') }

  const salvar = async () => {
    if (!editando.titulo?.trim()) return
    const salvo = await dados.salvarProjeto({
      ...editando, titulo: editando.titulo.trim(), data_prevista: editando.data_prevista || null,
      data_recebido: editando.status === 'recebido' ? (editando.data_recebido || new Date().toISOString().slice(0, 10)) : null,
    })
    if (salvo) { setAba(salvo.id); setEditando({ ...editando, id: salvo.id }) }
  }

  const projetoAtual = projetos.find((p) => p.id === aba)

  const addDependencia = async () => {
    if (!novaDependencia || !projetoAtual) return
    await dados.adicionarDependencia(projetoAtual.id, novaDependencia)
    setNovaDependencia('')
  }

  const addNota = async () => {
    if (!novaNota.trim() || !projetoAtual) return
    await dados.salvarNotaProjeto(projetoAtual.id, novaNota.trim())
    setNovaNota('')
  }

  const simular = () => {
    if (!simulacao?.projectId || !simulacao?.dias) return
    const resultado = simularAtraso(simulacao.projectId, Number(simulacao.dias), projetos)
    setSimulacao({ ...simulacao, resultado })
  }

  const confirmarSimulacao = async () => {
    await dados.aplicarSimulacaoAtraso(simulacao.resultado)
    setSimulacao(null)
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Projetos" subtitulo="Entregáveis, disciplinas e dependências" />
      <div style={{ padding: 20 }}>
        <div className="row-flex" style={{ gap: 8, marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={abrirNovo}>+ Novo projeto</button>
          <button className="btn btn-secondary" onClick={() => setSimulacao({ projectId: '', dias: 7 })}>Simular atraso</button>
        </div>
        <div className="stack-1">
          {projetos.length === 0 && <div className="t-caption">Nenhum projeto lançado ainda.</div>}
          {projetos.map((p) => {
            const sinal = sinalizar(p, projetos)
            return (
              <ItemLista
                key={p.id} titulo={p.titulo}
                subtitulo={`${ROTULO_STATUS_PROJETO[p.status]}${p.disciplina ? ` · ${p.disciplina}` : ''}${p.data_prevista ? ` · prevista ${formatarData(p.data_prevista)}` : ''}${sinal ? ` · ${sinal.texto}` : ''}`}
                onClick={() => abrir(p)}
              />
            )
          })}
        </div>
      </div>

      <Sheet aberto={Boolean(editando)} titulo={editando?.id ? editando.titulo || 'Projeto' : 'Novo projeto'} onFechar={fechar}
        rodape={<button className="btn btn-primary" style={{ width: '100%' }} onClick={salvar}>Salvar</button>}
      >
        {editando && (
          <>
            <Campo label="Título"><input style={campoEstilo()} value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} /></Campo>
            <div className="row-flex" style={{ gap: 8 }}>
              <Campo label="Disciplina"><input style={campoEstilo()} value={editando.disciplina || ''} onChange={(e) => setEditando({ ...editando, disciplina: e.target.value })} /></Campo>
              <Campo label="Etapa"><input style={campoEstilo()} value={editando.etapa || ''} onChange={(e) => setEditando({ ...editando, etapa: e.target.value })} /></Campo>
            </div>
            <Campo label="Responsável"><input style={campoEstilo()} value={editando.responsavel || ''} onChange={(e) => setEditando({ ...editando, responsavel: e.target.value })} /></Campo>
            <Campo label="Data prevista"><input type="date" style={campoEstilo()} value={editando.data_prevista || ''} onChange={(e) => setEditando({ ...editando, data_prevista: e.target.value })} /></Campo>
            <Campo label="Status">
              <select style={campoEstilo()} value={editando.status} onChange={(e) => setEditando({ ...editando, status: e.target.value })}>
                {Object.entries(ROTULO_STATUS_PROJETO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
            </Campo>
            <Campo label="Observações">
              <textarea style={{ ...campoEstilo(), minHeight: 50 }} value={editando.observacoes || ''} onChange={(e) => setEditando({ ...editando, observacoes: e.target.value })} />
            </Campo>

            {projetoAtual && (
              <>
                <div>
                  <div className="t-caption t-strong" style={{ marginBottom: 6 }}>Dependências (aguarda receber)</div>
                  <div className="stack-1">
                    {(projetoAtual.dependencias || []).map((d) => (
                      <div key={d.id} className="row-between card" style={{ padding: 8 }}>
                        <span>{projetos.find((p) => p.id === d.depende_de_id)?.titulo || 'Projeto removido'}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => dados.removerDependencia(d.id)}>Remover</button>
                      </div>
                    ))}
                    <div className="row-flex" style={{ gap: 6 }}>
                      <select style={campoEstilo()} value={novaDependencia} onChange={(e) => setNovaDependencia(e.target.value)}>
                        <option value="">Depende de…</option>
                        {projetos.filter((p) => p.id !== projetoAtual.id).map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                      </select>
                      <button className="btn btn-secondary btn-sm" onClick={addDependencia}>Adicionar</button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="t-caption t-strong" style={{ marginBottom: 6 }}>Anotações</div>
                  <div className="stack-1">
                    {(projetoAtual.notas || []).map((n) => (
                      <div key={n.id} className="card">
                        <div className="row-between">
                          <span>{n.texto}</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => dados.resolverNotaProjeto(n.id, n.situacao === 'aberta' ? 'resolvida' : 'aberta')}>
                            {n.situacao === 'aberta' ? 'Resolver' : 'Reabrir'}
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="row-flex" style={{ gap: 6 }}>
                      <input style={campoEstilo()} placeholder="Nova anotação…" value={novaNota} onChange={(e) => setNovaNota(e.target.value)} />
                      <button className="btn btn-secondary btn-sm" onClick={addNota}>Adicionar</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Sheet>

      <Sheet aberto={Boolean(simulacao)} titulo="Simular atraso" onFechar={() => setSimulacao(null)}>
        {simulacao && (
          <>
            <Campo label="Projeto que atrasa">
              <select style={campoEstilo()} value={simulacao.projectId} onChange={(e) => setSimulacao({ ...simulacao, projectId: e.target.value, resultado: null })}>
                <option value="">Escolha…</option>
                {projetos.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
            </Campo>
            <Campo label="Quantos dias de atraso">
              <input type="number" style={campoEstilo()} value={simulacao.dias} onChange={(e) => setSimulacao({ ...simulacao, dias: e.target.value, resultado: null })} />
            </Campo>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={simular}>Calcular impacto</button>
            {simulacao.resultado && (
              <div className="stack-1">
                {simulacao.resultado.length === 0 && <div className="t-caption">Nada depende desse projeto — sem impacto em cascata.</div>}
                {simulacao.resultado.map((r) => (
                  <div key={r.id} className="card row-between">
                    <span>{r.titulo}</span>
                    <span className="t-caption">{formatarData(r.dataAtual)} → {formatarData(r.dataSimulada)}</span>
                  </div>
                ))}
                {simulacao.resultado.length > 0 && (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={confirmarSimulacao}>Confirmar e aplicar novas datas</button>
                )}
              </div>
            )}
          </>
        )}
      </Sheet>
    </div>
  )
}
