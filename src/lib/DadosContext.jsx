import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const Ctx = createContext(null)

const SELECT_DIARIO = `
  id, worksite_id, data, status, clima, observacao, autor_id, atualizado_em,
  presencas:daily_attendance ( id, worker_id, company_id, presente ),
  atividades:daily_activities (
    id, service_id, location_id, status, observacao,
    equipe:daily_activity_workers ( worker_id )
  ),
  ocorrencias:daily_occurrences ( id, tipo_id, descricao, activity_id )
`

function normalizarDiario(d) {
  return {
    ...d,
    atividades: (d.atividades || []).map((a) => ({ ...a, equipe: (a.equipe || []).map((e) => e.worker_id) })),
  }
}

const SELECT_REQUISICAO = `
  id, worksite_id, numero, status, autor_id, observacao, created_at, atualizado_em,
  itens:material_request_items ( id, material_id, quantidade, unidade, observacao, quantidade_recebida )
`

export function DadosProvider({ perfil, children }) {
  const [obraId, setObraId] = useState(perfil.worksite_id || null)
  const [tudo, setTudo] = useState(null)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    setErro(null)
    const [
      worksites, companies, workers, locations, services, occurrenceTypes, dailyReports, plannedActivities, issues,
      materials, scheduleItems, materialRequests,
    ] = await Promise.all([
      supabase.from('worksites').select('*').order('nome'),
      supabase.from('companies').select('*').eq('ativo', true).order('nome'),
      supabase.from('workers').select('*').eq('ativo', true).order('nome'),
      supabase.from('locations').select('*').eq('ativo', true).order('nome'),
      supabase.from('services').select('*').eq('ativo', true).order('nome'),
      supabase.from('occurrence_types').select('*').eq('ativo', true).order('nome'),
      supabase.from('daily_reports').select(SELECT_DIARIO).order('data', { ascending: false }),
      supabase.from('planned_activities').select('*').order('data'),
      supabase.from('issues').select('*').order('created_at', { ascending: false }),
      supabase.from('materials').select('*').eq('ativo', true).order('nome'),
      supabase.from('schedule_items').select('*').order('ordem'),
      supabase.from('material_requests').select(SELECT_REQUISICAO).order('created_at', { ascending: false }),
    ])
    for (const r of [
      worksites, companies, workers, locations, services, occurrenceTypes, dailyReports, plannedActivities, issues,
      materials, scheduleItems, materialRequests,
    ]) {
      if (r.error) { setErro(r.error.message); return }
    }
    setTudo({
      worksites: worksites.data,
      companies: companies.data,
      workers: workers.data,
      locations: locations.data,
      services: services.data,
      occurrenceTypes: occurrenceTypes.data,
      dailyReports: dailyReports.data.map(normalizarDiario),
      plannedActivities: plannedActivities.data,
      issues: issues.data,
      materials: materials.data,
      scheduleItems: scheduleItems.data,
      materialRequests: materialRequests.data,
    })
    setObraId((atual) => atual || worksites.data?.[0]?.id || null)
  }, [])

  useEffect(() => { recarregar() }, [recarregar])

  const daObra = useMemo(() => {
    if (!tudo) return null
    const f = (lista) => lista.filter((x) => x.worksite_id === obraId)
    return {
      companies: f(tudo.companies),
      workers: f(tudo.workers),
      locations: f(tudo.locations),
      services: f(tudo.services),
      occurrenceTypes: tudo.occurrenceTypes,
      dailyReports: f(tudo.dailyReports),
      plannedActivities: f(tudo.plannedActivities),
      issues: f(tudo.issues),
      materials: tudo.materials,
      scheduleItems: f(tudo.scheduleItems),
      materialRequests: f(tudo.materialRequests),
    }
  }, [tudo, obraId])

  const checar = (r, msg) => {
    if (r.error) { setErro(`Não consegui ${msg}: ${r.error.message}`); return null }
    return r.data
  }

  // ── cadastros ──
  const salvarCadastro = useCallback(async (tabela, item) => {
    const linha = { ...item, organization_id: perfil.organization_id, worksite_id: obraId }
    const salvo = checar(await supabase.from(tabela).upsert(linha).select('*').single(), 'salvar o cadastro')
    if (!salvo) return null
    await recarregar()
    return salvo
  }, [perfil.organization_id, obraId, recarregar])

  const arquivarCadastro = useCallback(async (tabela, id) => {
    const ok = checar(await supabase.from(tabela).update({ ativo: false }).eq('id', id).select('id').single(), 'arquivar o cadastro')
    if (ok) await recarregar()
    return Boolean(ok)
  }, [recarregar])

  // ── diário ──
  const salvarDiario = useCallback(async (diario) => {
    const linhaReport = {
      id: diario.id, organization_id: perfil.organization_id, worksite_id: obraId,
      data: diario.data, status: diario.status || 'rascunho', clima: diario.clima || null,
      observacao: diario.observacao || null, autor_id: perfil.id, atualizado_em: new Date().toISOString(),
    }
    const salvo = checar(
      await supabase.from('daily_reports').upsert(linhaReport, { onConflict: 'worksite_id,data' }).select('id').single(),
      'salvar o diário',
    )
    if (!salvo) return null
    const reportId = salvo.id

    await supabase.from('daily_attendance').delete().eq('report_id', reportId)
    if (diario.presencas?.length) {
      await supabase.from('daily_attendance').insert(
        diario.presencas.map((p) => ({ report_id: reportId, worker_id: p.worker_id, company_id: p.company_id, presente: true })),
      )
    }

    await supabase.from('daily_activities').delete().eq('report_id', reportId)
    if (diario.atividades?.length) {
      for (const a of diario.atividades) {
        const at = checar(
          await supabase.from('daily_activities').insert({
            report_id: reportId, service_id: a.service_id || null, location_id: a.location_id || null,
            status: a.status || 'nao_iniciada', observacao: a.observacao || null,
          }).select('id').single(),
          'salvar a atividade',
        )
        if (at && a.equipe?.length) {
          await supabase.from('daily_activity_workers').insert(a.equipe.map((workerId) => ({ activity_id: at.id, worker_id: workerId })))
        }
      }
    }

    await supabase.from('daily_occurrences').delete().eq('report_id', reportId)
    if (diario.ocorrencias?.length) {
      await supabase.from('daily_occurrences').insert(
        diario.ocorrencias.map((o) => ({ report_id: reportId, tipo_id: o.tipo_id || null, descricao: o.descricao || null, activity_id: o.activity_id || null })),
      )
    }

    await recarregar()
    return reportId
  }, [perfil.organization_id, perfil.id, obraId, recarregar])

  // ── planejamento ──
  const salvarPlanejado = useCallback(async (item) => {
    const linha = { ...item, organization_id: perfil.organization_id, worksite_id: obraId }
    const salvo = checar(await supabase.from('planned_activities').upsert(linha).select('id').single(), 'salvar o planejamento')
    if (salvo) await recarregar()
    return salvo
  }, [perfil.organization_id, obraId, recarregar])

  const removerPlanejado = useCallback(async (id) => {
    const ok = checar(await supabase.from('planned_activities').delete().eq('id', id).select('id').single(), 'remover o planejamento')
    if (ok) await recarregar()
    return Boolean(ok)
  }, [recarregar])

  // ── pendências ──
  const salvarPendencia = useCallback(async (item) => {
    const linha = { ...item, organization_id: perfil.organization_id, worksite_id: obraId, autor_id: item.id ? item.autor_id : perfil.id }
    const salvo = checar(await supabase.from('issues').upsert(linha).select('id').single(), 'salvar a pendência')
    if (salvo) await recarregar()
    return salvo
  }, [perfil.organization_id, perfil.id, obraId, recarregar])

  const mudarStatusPendencia = useCallback(async (id, status) => {
    const campos = { status, resolvido_em: status === 'resolvida' ? new Date().toISOString() : null }
    const ok = checar(await supabase.from('issues').update(campos).eq('id', id).select('id').single(), 'mudar o status')
    if (ok) await recarregar()
    return Boolean(ok)
  }, [recarregar])

  // ── cronograma físico ──
  const salvarItemCronograma = useCallback(async (item) => {
    const linha = { ...item, organization_id: perfil.organization_id, worksite_id: obraId, parent_id: item.parent_id || null }
    const salvo = checar(await supabase.from('schedule_items').upsert(linha).select('id').single(), 'salvar o item do cronograma')
    if (salvo) await recarregar()
    return salvo
  }, [perfil.organization_id, obraId, recarregar])

  const removerItemCronograma = useCallback(async (id) => {
    const ok = checar(await supabase.from('schedule_items').delete().eq('id', id).select('id').single(), 'remover o item')
    if (ok) await recarregar()
    return Boolean(ok)
  }, [recarregar])

  // ── requisições de materiais ──
  const salvarRequisicao = useCallback(async (requisicao) => {
    const { itens, ...cabecalho } = requisicao
    const linha = {
      ...cabecalho, organization_id: perfil.organization_id, worksite_id: obraId,
      autor_id: requisicao.id ? requisicao.autor_id : perfil.id, atualizado_em: new Date().toISOString(),
    }
    const salvo = checar(await supabase.from('material_requests').upsert(linha).select('id').single(), 'salvar a requisição')
    if (!salvo) return null
    const requestId = salvo.id

    await supabase.from('material_request_items').delete().eq('request_id', requestId)
    if (itens?.length) {
      await supabase.from('material_request_items').insert(
        itens.map((it) => ({
          request_id: requestId, material_id: it.material_id || null, quantidade: it.quantidade,
          unidade: it.unidade || null, observacao: it.observacao || null, quantidade_recebida: it.quantidade_recebida || 0,
        })),
      )
    }
    await recarregar()
    return requestId
  }, [perfil.organization_id, perfil.id, obraId, recarregar])

  const mudarStatusRequisicao = useCallback(async (id, status) => {
    const ok = checar(
      await supabase.from('material_requests').update({ status, atualizado_em: new Date().toISOString() }).eq('id', id).select('id').single(),
      'mudar o status da requisição',
    )
    if (ok) await recarregar()
    return Boolean(ok)
  }, [recarregar])

  /* Recebimento parcial soma ao que já tinha sido recebido — nunca
     sobrescreve, pra não perder o histórico de entregas anteriores. */
  const registrarRecebimento = useCallback(async (itemId, quantidadeRecebidaAgora) => {
    const item = tudo.materialRequests.flatMap((r) => r.itens).find((i) => i.id === itemId)
    if (!item) return false
    const novaQuantidade = Number(item.quantidade_recebida || 0) + Number(quantidadeRecebidaAgora)
    const ok = checar(
      await supabase.from('material_request_items').update({ quantidade_recebida: novaQuantidade }).eq('id', itemId).select('id').single(),
      'registrar o recebimento',
    )
    if (ok) await recarregar()
    return Boolean(ok)
  }, [tudo, recarregar])

  const valor = useMemo(() => ({
    perfil, tudo, daObra, obraId, setObraId, erro, recarregar,
    salvarCadastro, arquivarCadastro, salvarDiario, salvarPlanejado, removerPlanejado,
    salvarPendencia, mudarStatusPendencia,
    salvarItemCronograma, removerItemCronograma,
    salvarRequisicao, mudarStatusRequisicao, registrarRecebimento,
  }), [
    perfil, tudo, daObra, obraId, erro, recarregar, salvarCadastro, arquivarCadastro, salvarDiario, salvarPlanejado, removerPlanejado,
    salvarPendencia, mudarStatusPendencia, salvarItemCronograma, removerItemCronograma,
    salvarRequisicao, mudarStatusRequisicao, registrarRecebimento,
  ])

  if (!tudo) {
    return <div className="empty">{erro ? `Erro ao carregar: ${erro}` : 'Carregando os dados da obra…'}</div>
  }

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useDados() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDados precisa estar dentro de <DadosProvider>')
  return ctx
}
