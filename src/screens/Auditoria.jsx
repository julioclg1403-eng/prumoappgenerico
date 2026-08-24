import { useDados } from '../lib/DadosContext'
import { PageHeader, ItemLista } from '../components'
import { formatarDataHora } from '../lib/dominio'

export default function Auditoria() {
  const dados = useDados()
  const log = dados.daObra.auditLog

  /* Não existe (ainda) uma tela de Usuários que carregue os perfis de
     todo mundo — só o próprio dá pra nomear com certeza. */
  const nomeAutor = (id) => (id === dados.perfil.id ? (dados.perfil.nome || dados.perfil.email) : 'Outro usuário da equipe')

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Auditoria" subtitulo="Últimas 200 operações críticas — não dá pra apagar ou editar" />
      <div style={{ padding: 20 }}>
        <div className="stack-1">
          {log.length === 0 && <div className="t-caption">Nenhum registro ainda.</div>}
          {log.map((l) => (
            <ItemLista
              key={l.id} titulo={l.acao}
              subtitulo={`${l.entidade}${l.detalhe ? ` · ${l.detalhe}` : ''} · ${nomeAutor(l.autor_id)} · ${formatarDataHora(l.created_at)}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
