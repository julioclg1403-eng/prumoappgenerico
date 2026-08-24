import { useState } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, Segmentos, ItemLista, Sheet, Campo, campoEstilo } from '../components'
import {
  formatarDataHora, nomeDe, ROTULO_STATUS_REQUISICAO, FLUXO_REQUISICAO,
  saldoPendente, requisicaoRecebidaPorCompleto,
} from '../lib/dominio'

const VAZIA = { status: 'rascunho', observacao: '', itens: [] }

export default function Requisicoes() {
  const dados = useDados()
  const [filtro, setFiltro] = useState('todos')
  const [editando, setEditando] = useState(null)
  const [abrindoId, setAbrindoId] = useState(null)
  const [recebendo, setRecebendo] = useState({})

  const opcoesFiltro = [{ valor: 'todos', rotulo: 'Todos' }, ...FLUXO_REQUISICAO.map((s) => ({ valor: s, rotulo: ROTULO_STATUS_REQUISICAO[s] }))]
  const lista = dados.daObra.materialRequests.filter((r) => filtro === 'todos' || r.status === filtro)
  const abrindo = dados.daObra.materialRequests.find((r) => r.id === abrindoId) || null

  const adicionarItem = () => setEditando((p) => ({ ...p, itens: [...p.itens, { material_id: '', quantidade: '', unidade: '', observacao: '' }] }))
  const atualizarItem = (i, campos) => setEditando((p) => ({ ...p, itens: p.itens.map((it, idx) => (idx === i ? { ...it, ...campos } : it)) }))
  const removerItem = (i) => setEditando((p) => ({ ...p, itens: p.itens.filter((_, idx) => idx !== i) }))

  const salvar = async () => {
    await dados.salvarRequisicao({ ...editando, itens: editando.itens.filter((it) => it.material_id && it.quantidade) })
    setEditando(null)
  }

  const avancarStatus = async (r, novoStatus) => {
    await dados.mudarStatusRequisicao(r.id, novoStatus)
    if (novoStatus === 'recebido') setAbrindoId(null)
  }

  const confirmarRecebimento = async (itemId) => {
    const qtd = Number(recebendo[itemId] || 0)
    if (qtd <= 0) return
    await dados.registrarRecebimento(itemId, qtd)
    setRecebendo((p) => ({ ...p, [itemId]: '' }))
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Requisições de materiais" />
      <Segmentos opcoes={opcoesFiltro} atual={filtro} onEscolher={setFiltro} />
      <div style={{ padding: 20 }}>
        <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={() => setEditando({ ...VAZIA })}>+ Nova requisição</button>
        <div className="stack-1">
          {lista.length === 0 && <div className="t-caption">Nada por aqui.</div>}
          {lista.map((r) => (
            <ItemLista
              key={r.id} titulo={`Requisição #${r.numero}`}
              subtitulo={`${ROTULO_STATUS_REQUISICAO[r.status]} · ${r.itens.length} item(ns) · ${formatarDataHora(r.atualizado_em)}`}
              onClick={() => setAbrindoId(r.id)}
            />
          ))}
        </div>
      </div>

      <Sheet
        aberto={Boolean(editando)} titulo="Nova requisição (rascunho)" onFechar={() => setEditando(null)}
        rodape={<button className="btn btn-primary" style={{ width: '100%' }} onClick={salvar}>Salvar rascunho</button>}
      >
        {editando && (
          <>
            <div className="row-between">
              <span className="t-caption t-strong">Itens</span>
              <button className="btn btn-ghost btn-sm" onClick={adicionarItem}>+ Adicionar</button>
            </div>
            <div className="stack-1">
              {editando.itens.map((it, i) => (
                <div key={i} className="card stack-1">
                  <select
                    style={campoEstilo()} value={it.material_id}
                    onChange={(e) => {
                      const m = dados.daObra.materials.find((x) => x.id === e.target.value)
                      atualizarItem(i, { material_id: e.target.value, unidade: m?.unidade || '' })
                    }}
                  >
                    <option value="">Material…</option>
                    {dados.daObra.materials.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                  <div className="row-flex" style={{ gap: 8 }}>
                    <input type="number" min={0} step="any" placeholder="Quantidade" style={campoEstilo()} value={it.quantidade} onChange={(e) => atualizarItem(i, { quantidade: e.target.value })} />
                    <input placeholder="Unidade" style={campoEstilo()} value={it.unidade} onChange={(e) => atualizarItem(i, { unidade: e.target.value })} />
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => removerItem(i)}>Remover item</button>
                </div>
              ))}
            </div>
            <Campo label="Observação">
              <textarea style={{ ...campoEstilo(), minHeight: 60 }} value={editando.observacao} onChange={(e) => setEditando({ ...editando, observacao: e.target.value })} />
            </Campo>
          </>
        )}
      </Sheet>

      <Sheet aberto={Boolean(abrindo)} titulo={abrindo ? `Requisição #${abrindo.numero}` : ''} onFechar={() => setAbrindoId(null)}>
        {abrindo && (
          <>
            <div className="t-caption">Status: <b>{ROTULO_STATUS_REQUISICAO[abrindo.status]}</b></div>
            <div className="stack-1">
              {abrindo.itens.map((it) => (
                <div key={it.id} className="card">
                  <div className="row-between">
                    <span className="t-strong">{nomeDe(dados.daObra.materials, it.material_id)}</span>
                    <span className="t-caption">{it.quantidade} {it.unidade}</span>
                  </div>
                  <div className="t-caption">Recebido: {it.quantidade_recebida} · Saldo: {saldoPendente(it)}</div>
                  {abrindo.status === 'transito' && saldoPendente(it) > 0 && (
                    <div className="row-flex" style={{ gap: 6, marginTop: 6 }}>
                      <input
                        type="number" min={0} max={saldoPendente(it)} step="any" placeholder="Receber agora" style={campoEstilo()}
                        value={recebendo[it.id] || ''} onChange={(e) => setRecebendo((p) => ({ ...p, [it.id]: e.target.value }))}
                      />
                      <button className="btn btn-secondary btn-sm" onClick={() => confirmarRecebimento(it.id)}>Registrar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="stack-1">
              {abrindo.status === 'rascunho' && <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => avancarStatus(abrindo, 'enviado')}>Enviar</button>}
              {abrindo.status === 'enviado' && <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => avancarStatus(abrindo, 'cotacao')}>Colocar em cotação</button>}
              {(abrindo.status === 'enviado' || abrindo.status === 'cotacao') && <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => avancarStatus(abrindo, 'aprovado')}>Aprovar / marcar como comprado</button>}
              {abrindo.status === 'aprovado' && <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => avancarStatus(abrindo, 'transito')}>Marcar em trânsito</button>}
              {abrindo.status === 'transito' && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => avancarStatus(abrindo, 'recebido')}>
                  {requisicaoRecebidaPorCompleto(abrindo) ? 'Marcar como recebido' : 'Marcar como recebido (mesmo com saldo em aberto)'}
                </button>
              )}
            </div>
          </>
        )}
      </Sheet>
    </div>
  )
}
