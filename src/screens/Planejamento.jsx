import { useState, useMemo } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, ItemLista, Sheet, Campo, campoEstilo } from '../components'
import { formatarData, hojeISO, nomeDe } from '../lib/dominio'

function inicioDaSemana(dataISO) {
  const d = new Date(`${dataISO}T00:00:00`)
  const diaSemana = d.getDay()
  d.setDate(d.getDate() - diaSemana)
  return d
}

function paraISO(d) {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

const VAZIO = { data: hojeISO(), company_id: '', service_id: '', location_id: '', observacao: '' }

export default function Planejamento() {
  const dados = useDados()
  const [referencia, setReferencia] = useState(hojeISO())
  const [editando, setEditando] = useState(null)

  const diasDaSemana = useMemo(() => {
    const inicio = inicioDaSemana(referencia)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio)
      d.setDate(d.getDate() + i)
      return paraISO(d)
    })
  }, [referencia])

  const porDia = (dia) => dados.daObra.plannedActivities.filter((p) => p.data === dia)

  const salvar = async () => {
    await dados.salvarPlanejado(editando)
    setEditando(null)
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Planejamento" subtitulo="Semana" />
      <div className="row-flex" style={{ gap: 8, padding: '0 20px 12px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setReferencia(paraISO(new Date(new Date(referencia).setDate(new Date(referencia).getDate() - 7))))}>◀ Semana anterior</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setReferencia(paraISO(new Date(new Date(referencia).setDate(new Date(referencia).getDate() + 7))))}>Próxima semana ▶</button>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div className="stack-2">
          {diasDaSemana.map((dia) => (
            <div key={dia} className="card">
              <div className="row-between" style={{ marginBottom: 8 }}>
                <span className="t-strong">{formatarData(dia)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditando({ ...VAZIO, data: dia })}>+ Atividade</button>
              </div>
              <div className="stack-1">
                {porDia(dia).length === 0 && <div className="t-caption">Nada planejado.</div>}
                {porDia(dia).map((p) => (
                  <ItemLista
                    key={p.id}
                    titulo={nomeDe(dados.daObra.services, p.service_id)}
                    subtitulo={`${nomeDe(dados.daObra.companies, p.company_id)} · ${nomeDe(dados.daObra.locations, p.location_id)}`}
                    direita={<button className="btn btn-ghost btn-sm" onClick={() => dados.removerPlanejado(p.id)}>Remover</button>}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Sheet
        aberto={Boolean(editando)} titulo="Nova atividade planejada" onFechar={() => setEditando(null)}
        rodape={<button className="btn btn-primary" style={{ width: '100%' }} onClick={salvar}>Salvar</button>}
      >
        {editando && (
          <>
            <Campo label="Data">
              <input type="date" style={campoEstilo()} value={editando.data} onChange={(e) => setEditando({ ...editando, data: e.target.value })} />
            </Campo>
            <Campo label="Empresa">
              <select style={campoEstilo()} value={editando.company_id} onChange={(e) => setEditando({ ...editando, company_id: e.target.value })}>
                <option value="">—</option>
                {dados.daObra.companies.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Serviço">
              <select style={campoEstilo()} value={editando.service_id} onChange={(e) => setEditando({ ...editando, service_id: e.target.value })}>
                <option value="">—</option>
                {dados.daObra.services.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Local">
              <select style={campoEstilo()} value={editando.location_id} onChange={(e) => setEditando({ ...editando, location_id: e.target.value })}>
                <option value="">—</option>
                {dados.daObra.locations.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </Campo>
          </>
        )}
      </Sheet>
    </div>
  )
}
