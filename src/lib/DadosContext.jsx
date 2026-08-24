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

export function DadosProvider({ perfil, children }) {
  const [obraId, setObraId] = useState(perfil.worksite_id || null)
  const [tudo, setTudo] = useState(null)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    setErro(null)
    const [worksites, companies, workers, locations, services, occurrenceTypes, dailyReports, plannedActivities, issues] = await Promise.all([
      supabase.from('worksites').select('*').order('nome'),
      supabase.from('companies').select('*').eq('ativo', true).order('nome'),
      supabase.from('workers').select('*').eq('ativo', true).order('nome'),
      supabase.from('locations').select('*').eq('ativo', true).order('nome'),
      supabase.from('services').select('*').eq('ativo', true).order('nome'),
      supabase.from('occurrence_types').select('*').eq('ativo', true).order('nome'),
      supabase.from('daily_reports').select(SELECT_DIARIO).order('data', { ascending: false }),
      supabase.from('planned_activities').select('*').order('data'),
      supabase.from('issues').select('*').order('created_at', { ascending: false }),
    ])
    for (const r of [worksites, companies, workers, locations, services, occurrenceTypes, dailyReports, plannedActivities, issues]) {
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

  const valor = useMemo(() => ({
    perfil, tudo, daObra, obraId, setObraId, erro, recarregar,
    salvarCadastro, arquivarCadastro, salvarDiario, salvarPlanejado, removerPlanejado,
    salvarPendencia, mudarStatusPendencia,
  }), [perfil, tudo, daObra, obraId, erro, recarregar, salvarCadastro, arquivarCadastro, salvarDiario, salvarPlanejado, removerPlanejado, salvarPendencia, mudarStatusPendencia])

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
