export const ROTULO_STATUS_ATIVIDADE = {
  nao_iniciada: 'Não iniciada', em_andamento: 'Em andamento', concluida: 'Concluída',
}

export const ROTULO_PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

export function formatarData(iso) {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarDataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function hojeISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/* "Em aberto" inclui as atrasadas — mesma regra alimenta tela e contador. */
export function pendenciasEmAberto(issues) {
  return (issues || []).filter((i) => i.status === 'aberta')
}
export function pendenciasAtrasadas(issues) {
  const hoje = hojeISO()
  return pendenciasEmAberto(issues).filter((i) => i.prazo && i.prazo < hoje)
}

export function nomeDe(lista, id) {
  return (lista || []).find((x) => x.id === id)?.nome || '—'
}

export const ROTULO_STATUS_REQUISICAO = {
  rascunho: 'Rascunho', enviado: 'Enviado', cotacao: 'Em cotação',
  aprovado: 'Aprovado/comprado', transito: 'Em trânsito', recebido: 'Recebido',
}

export const FLUXO_REQUISICAO = ['rascunho', 'enviado', 'cotacao', 'aprovado', 'transito', 'recebido']

/* Saldo do item nunca é editável direto — só cresce por recebimento
   registrado, preservando o histórico do que já chegou. */
export function saldoPendente(item) {
  return Math.max(0, Number(item.quantidade) - Number(item.quantidade_recebida || 0))
}

export function requisicaoRecebidaPorCompleto(requisicao) {
  return (requisicao.itens || []).length > 0 && requisicao.itens.every((it) => saldoPendente(it) <= 0)
}

export const ROTULO_STATUS_PROJETO = { nao_iniciado: 'Não iniciado', em_andamento: 'Em andamento', recebido: 'Recebido' }
export const ROTULO_SITUACAO_EQUIPAMENTO = { ativo: 'Em uso', manutencao: 'Manutenção', devolvido: 'Devolvido' }

/* Sinais calculados a partir dos dados — nunca um status manual, pra
   não desalinhar da realidade (guia, seção 5.11). */
export function projetoAtrasado(p) {
  return Boolean(p.data_prevista) && p.status !== 'recebido' && p.data_prevista < hojeISO()
}
export function projetoSemPrazo(p) {
  return !p.data_prevista && p.status !== 'recebido'
}
export function projetoAguardandoDependencia(p, projetos) {
  return (p.dependencias || []).some((d) => {
    const dep = projetos.find((x) => x.id === d.depende_de_id)
    return dep && dep.status !== 'recebido'
  })
}

export function projetosQueDependemDe(projectId, projetos) {
  return projetos.filter((p) => (p.dependencias || []).some((d) => d.depende_de_id === projectId))
}

export function somarDias(iso, dias) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + Number(dias))
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/* Percorre em cascata quem depende (direta ou indiretamente) do
   projeto escolhido. Não altera nada — só calcula a prévia. */
export function simularAtraso(projectId, dias, projetos) {
  const impactados = []
  const visitar = (id) => {
    for (const dep of projetosQueDependemDe(id, projetos)) {
      if (impactados.some((i) => i.id === dep.id)) continue
      impactados.push({
        id: dep.id, titulo: dep.titulo, dataAtual: dep.data_prevista,
        dataSimulada: dep.data_prevista ? somarDias(dep.data_prevista, dias) : null,
      })
      visitar(dep.id)
    }
  }
  visitar(projectId)
  return impactados
}

export function equipamentoVencido(e) {
  return Boolean(e.previsao_devolucao) && e.situacao === 'ativo' && e.previsao_devolucao < hojeISO()
}
export function equipamentoProximo(e) {
  return Boolean(e.previsao_devolucao) && e.situacao === 'ativo' && !equipamentoVencido(e) && e.previsao_devolucao <= somarDias(hojeISO(), 3)
}

/* Um só lugar pra juntar tudo que pede atenção — o painel inicial e o
   contador do menu usam a mesma lista, pra não mostrar número
   diferente do que a tela detalha (mesma regra da seção 5.8). */
export function alertasConsolidados(daObra) {
  const alertas = []
  for (const p of pendenciasAtrasadas(daObra.issues)) {
    alertas.push({ tipo: 'Pendência atrasada', titulo: p.titulo, detalhe: p.prazo ? `prazo ${formatarData(p.prazo)}` : '' })
  }
  for (const p of daObra.projects) {
    if (projetoAtrasado(p)) alertas.push({ tipo: 'Projeto atrasado', titulo: p.titulo, detalhe: p.data_prevista ? `previsto ${formatarData(p.data_prevista)}` : '' })
  }
  for (const e of daObra.equipment) {
    if (equipamentoVencido(e)) alertas.push({ tipo: 'Devolução vencida', titulo: e.identificacao, detalhe: formatarData(e.previsao_devolucao) })
    else if (equipamentoProximo(e)) alertas.push({ tipo: 'Devolução próxima', titulo: e.identificacao, detalhe: formatarData(e.previsao_devolucao) })
  }
  return alertas
}
