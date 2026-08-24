import { PageHeader } from '../components'

export default function Inicio({ perfil }) {
  return (
    <div>
      <PageHeader
        titulo={`Olá, ${perfil.nome || perfil.email}`}
        subtitulo={perfil.role === 'campo' ? 'Perfil de campo' : 'Perfil de gestão'}
      />
      <div style={{ padding: '0 20px 100px' }}>
        <div className="card">
          <div className="t-strong">Fundação pronta</div>
          <p className="t-caption">
            Login, organização, obra e perfil já estão funcionando. Os módulos
            (diário, planejamento, pendências, requisições…) entram nas próximas fases.
          </p>
        </div>
      </div>
    </div>
  )
}
