import { PageHeader } from '../components'
import { useDados } from '../lib/DadosContext'
import { pendenciasEmAberto, pendenciasAtrasadas, hojeISO } from '../lib/dominio'

export default function Inicio({ perfil }) {
  const dados = useDados()
  const diarioHoje = dados.daObra.dailyReports.find((d) => d.data === hojeISO())
  const emAberto = pendenciasEmAberto(dados.daObra.issues).length
  const atrasadas = pendenciasAtrasadas(dados.daObra.issues).length
  const planejadoHoje = dados.daObra.plannedActivities.filter((p) => p.data === hojeISO()).length

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
      </div>
    </div>
  )
}
