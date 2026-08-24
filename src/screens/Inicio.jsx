import { PageHeader, ItemLista } from '../components'
import { useDados } from '../lib/DadosContext'
import { pendenciasEmAberto, pendenciasAtrasadas, hojeISO, alertasConsolidados } from '../lib/dominio'

export default function Inicio({ perfil }) {
  const dados = useDados()
  const diarioHoje = dados.daObra.dailyReports.find((d) => d.data === hojeISO())
  const emAberto = pendenciasEmAberto(dados.daObra.issues).length
  const atrasadas = pendenciasAtrasadas(dados.daObra.issues).length
  const planejadoHoje = dados.daObra.plannedActivities.filter((p) => p.data === hojeISO()).length
  const alertas = alertasConsolidados(dados.daObra)

  return (
    <div>
      <PageHeader
        titulo={`Olá, ${perfil.nome || perfil.email}`}
        subtitulo={perfil.role === 'campo' ? 'Perfil de campo' : 'Perfil de gestão'}
      />
      <div style={{ padding: '0 20px 100px' }}>
        <div className="stack-1">
          <div className="card row-between">
            <span>Diário de hoje</span>
            <span className="t-strong">{diarioHoje ? (diarioHoje.status === 'concluido' ? 'Concluído' : 'Rascunho') : 'Não lançado'}</span>
          </div>
          <div className="card row-between">
            <span>Planejado para hoje</span>
            <span className="t-strong">{planejadoHoje}</span>
          </div>
          <div className="card row-between">
            <span>Pendências em aberto</span>
            <span className="t-strong">{emAberto}</span>
          </div>
          <div className="card row-between">
            <span>Pendências atrasadas</span>
            <span className="t-strong" style={{ color: atrasadas ? 'var(--danger)' : 'inherit' }}>{atrasadas}</span>
          </div>
        </div>

        {alertas.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div className="t-caption t-strong" style={{ marginBottom: 8 }}>Pede atenção ({alertas.length})</div>
            <div className="stack-1">
              {alertas.slice(0, 8).map((a, i) => (
                <ItemLista key={i} titulo={a.titulo} subtitulo={`${a.tipo}${a.detalhe ? ` · ${a.detalhe}` : ''}`} />
              ))}
              {alertas.length > 8 && <div className="t-caption">+ {alertas.length - 8} outro(s).</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
