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
