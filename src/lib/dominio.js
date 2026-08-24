export const ROTULO_STATUS_ATIVIDADE = {
  nao_iniciada: 'Não iniciada', em_andamento: 'Em andamento', concluida: 'Concluída',
}

export const ROTULO_PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

export function formatarData(iso) {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
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
