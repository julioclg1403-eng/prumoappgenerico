import { useState, useMemo } from 'react'
import { useDados } from '../lib/DadosContext'
import { PageHeader, Segmentos } from '../components'
import { baixarCSV } from '../lib/exportar'
import {
  formatarData, formatarDataHora, nomeDe, ROTULO_PRIORIDADE, ROTULO_STATUS_PROJETO,
  ROTULO_STATUS_REQUISICAO, ROTULO_SITUACAO_EQUIPAMENTO, saldoPendente,
} from '../lib/dominio'

const TIPOS = [
  { valor: 'pendencias', rotulo: 'Pendências' },
  { valor: 'projetos', rotulo: 'Projetos' },
  { valor: 'equipamentos', rotulo: 'Equipamentos' },
  { valor: 'requisicoes', rotulo: 'Requisições' },
]

/* Mesmas regras de negócio da tela, os mesmos dados — só muda a
   apresentação (tabela pra imprimir/exportar). Guia, seção 5.18. */
function montarRelatorio(tipo, daObra) {
  if (tipo === 'pendencias') {
    return {
      cabecalho: ['Título', 'Prioridade', 'Prazo', 'Status'],
      linhas: daObra.issues.map((p) => [p.titulo, ROTULO_PRIORIDADE[p.prioridade], formatarData(p.prazo), p.status === 'aberta' ? 'Em aberto' : 'Resolvida']),
    }
  }
  if (tipo === 'projetos') {
    return {
      cabecalho: ['Título', 'Disciplina', 'Status', 'Data prevista', 'Data recebido'],
      linhas: daObra.projects.map((p) => [p.titulo, p.disciplina || '', ROTULO_STATUS_PROJETO[p.status], formatarData(p.data_prevista), formatarData(p.data_recebido)]),
    }
  }
  if (tipo === 'equipamentos') {
    return {
      cabecalho: ['Identificação', 'Tipo', 'Situação', 'Local atual', 'Previsão devolução'],
      linhas: daObra.equipment.map((e) => [e.identificacao, e.tipo || '', ROTULO_SITUACAO_EQUIPAMENTO[e.situacao], e.local_atual || '', formatarData(e.previsao_devolucao)]),
    }
  }
  // requisicoes
  const linhas = []
  for (const r of daObra.materialRequests) {
    for (const it of r.itens) {
      linhas.push([
        `#${r.numero}`, ROTULO_STATUS_REQUISICAO[r.status], nomeDe(daObra.materials, it.material_id),
        it.quantidade, it.quantidade_recebida, saldoPendente(it), formatarDataHora(r.atualizado_em),
      ])
    }
  }
  return { cabecalho: ['Requisição', 'Status', 'Material', 'Quantidade', 'Recebido', 'Saldo', 'Atualizado em'], linhas }
}

export default function Relatorios() {
  const dados = useDados()
  const [tipo, setTipo] = useState('pendencias')
  const relatorio = useMemo(() => montarRelatorio(tipo, dados.daObra), [tipo, dados.daObra])
  const hoje = new Date().toLocaleDateString('pt-BR')

  return (
    <div style={{ paddingBottom: 100 }}>
      <PageHeader titulo="Relatórios" subtitulo="Mesmos dados e filtros das telas — pronto pra imprimir ou exportar" />
      <Segmentos opcoes={TIPOS} atual={tipo} onEscolher={setTipo} />
      <div style={{ padding: 20 }}>
        <div className="row-flex" style={{ gap: 8, marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
          <button
            className="btn btn-secondary"
            onClick={() => baixarCSV(`${tipo}-${hoje.replace(/\//g, '-')}`, relatorio.cabecalho, relatorio.linhas)}
          >
            Baixar planilha (CSV)
          </button>
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <span className="t-strong">{TIPOS.find((t) => t.valor === tipo).rotulo}</span>
            <span className="t-caption">Gerado em {hoje} por {dados.perfil.nome || dados.perfil.email}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tabela-relatorio">
              <thead>
                <tr>{relatorio.cabecalho.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {relatorio.linhas.length === 0 && (
                  <tr><td colSpan={relatorio.cabecalho.length} className="t-caption">Nada pra mostrar.</td></tr>
                )}
                {relatorio.linhas.map((linha, i) => (
                  <tr key={i}>{linha.map((v, j) => <td key={j}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
