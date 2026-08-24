import { useState } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, Segmentos, ItemLista, Sheet, Campo, campoEstilo } from '../components'

const ABAS = [
  { valor: 'companies', rotulo: 'Empresas' },
  { valor: 'workers', rotulo: 'Colaboradores' },
  { valor: 'locations', rotulo: 'Locais' },
  { valor: 'services', rotulo: 'Serviços' },
]

export default function Cadastros() {
  const dados = useDados()
  const [aba, setAba] = useState('companies')
  const [editando, setEditando] = useState(null)

  const listas = {
    companies: dados.daObra.companies,
    workers: dados.daObra.workers,
    locations: dados.daObra.locations,
    services: dados.daObra.services,
  }
  const lista = listas[aba]

  const abrirNovo = () => setEditando(aba === 'workers' ? { nome: '', funcao: '', company_id: '' } : { nome: '' })

  const salvar = async () => {
    if (!editando.nome?.trim()) return
    await dados.salvarCadastro(aba, { ...editando, nome: editando.nome.trim() })
    setEditando(null)
  }

  const arquivar = async (id) => {
    await dados.arquivarCadastro(aba, id)
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Cadastros" subtitulo="Empresas, colaboradores, locais e serviços da obra" />
      <Segmentos opcoes={ABAS} atual={aba} onEscolher={setAba} />
      <div style={{ padding: 20 }}>
        <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={abrirNovo}>+ Novo</button>
        <div className="stack-1">
          {lista.length === 0 && <div className="t-caption">Nenhum registro ainda.</div>}
          {lista.map((item) => (
            <ItemLista
              key={item.id} titulo={item.nome}
              subtitulo={aba === 'workers' ? (item.funcao || undefined) : undefined}
              direita={<button className="btn btn-ghost btn-sm" onClick={() => arquivar(item.id)}>Arquivar</button>}
              onClick={() => setEditando(item)}
            />
          ))}
        </div>
      </div>

      <Sheet
        aberto={Boolean(editando)} titulo={editando?.id ? 'Editar' : 'Novo cadastro'} onFechar={() => setEditando(null)}
        rodape={<button className="btn btn-primary" style={{ width: '100%' }} onClick={salvar}>Salvar</button>}
      >
        {editando && (
          <>
            <Campo label="Nome">
              <input style={campoEstilo()} value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
            </Campo>
            {aba === 'workers' && (
              <>
                <Campo label="Função">
                  <input style={campoEstilo()} value={editando.funcao || ''} onChange={(e) => setEditando({ ...editando, funcao: e.target.value })} />
                </Campo>
                <Campo label="Empresa">
                  <select
                    style={campoEstilo()} value={editando.company_id || ''}
                    onChange={(e) => setEditando({ ...editando, company_id: e.target.value })}
                  >
                    <option value="">—</option>
                    {dados.daObra.companies.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </Campo>
              </>
            )}
          </>
        )}
      </Sheet>
    </div>
  )
}
