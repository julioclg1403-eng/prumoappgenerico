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

const SELECT_PROJETO = `
  id, worksite_id, titulo, disciplina, etapa, responsavel, data_prevista, data_recebido, status, observacoes, created_at,
  dependencias:project_dependencies!project_dependencies_project_id_fkey ( id, depende_de_id ),
  notas:project_notes ( id, texto, situacao, autor_id, created_at )
`

export function DadosProvider({ perfil, children }) {
  const [obraId, setObraId] = useState(perfil.worksite_id || null)
  const [tudo, setTudo] = useState(null)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    setErro(null)
    const [
      worksites, companies, workers, locations, services, occurrenceTypes, dailyReports, plannedActivities, issues,
      materials, scheduleItems, materialRequests, equipment, projects, auditLog,
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
      supabase.from('equipment').select('*').eq('ativo', true).order('identificacao'),
      supabase.from('projects').select(SELECT_PROJETO).order('created_at', { ascending: false }),
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
    ])
    for (const r of [
      worksites, companies, workers, locations, services, occurrenceTypes, dailyReports, plannedActivities, issues,
      materials, scheduleItems, materialRequests, equipment, projects, auditLog,
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
      equipment: equipment.data,
      projects: projects.data,
      auditLog: auditLog.data,
    })
    setObraId((atual) => atual || worksites.data?.[0]?.id || null)
  }, [])

  /* Log de auditoria: cobre as operações que alteram o estado de um
     registro pros outros (mudar status, confirmar recebimento,
     dependências, simulação) — não cada campo editado. Falha aqui
     nunca derruba a ação principal, que já foi salva antes disto. */
  const registrarAuditoria = useCallback(async (acao, entidade, entidadeId, detalhe) => {
    await supabase.from('audit_log').insert({
      organization_id: perfil.organization_id, worksite_id: obraId, autor_id: perfil.id,
      acao, entidade, entidade_id: entidadeId || null, detalhe: detalhe || null,
    })
  }, [perfil.organization_id, perfil.id, obraId])

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
      equipment: f(tudo.equipment),
      projects: f(tudo.projects),
      auditLog: f(tudo.auditLog),
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
    if (ok) { await registrarAuditoria(`pendência → ${status}`, 'issue', id); await recarregar() }
    return Boolean(ok)
  }, [recarregar, registrarAuditoria])

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
    if (ok) { await registrarAuditoria(`requisição → ${status}`, 'material_request', id); await recarregar() }
    return Boolean(ok)
  }, [recarregar, registrarAuditoria])

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
    if (ok) {
      await registrarAuditoria('recebimento registrado', 'material_request_item', itemId, `+${quantidadeRecebidaAgora}`)
      await recarregar()
    }
    return Boolean(ok)
  }, [tudo, recarregar, registrarAuditoria])

  // ── equipamentos ──
  const salvarEquipamento = useCallback(async (item) => {
    const linha = { ...item, organization_id: perfil.organization_id, worksite_id: obraId }
    const salvo = checar(await supabase.from('equipment').upsert(linha).select('id').single(), 'salvar o equipamento')
    if (salvo) await recarregar()
    return salvo
  }, [perfil.organization_id, obraId, recarregar])

  const arquivarEquipamento = useCallback(async (id) => {
    const ok = checar(await supabase.from('equipment').update({ ativo: false }).eq('id', id).select('id').single(), 'arquivar o equipamento')
    if (ok) await recarregar()
    return Boolean(ok)
  }, [recarregar])

  // ── projetos e dependências ──
  const salvarProjeto = useCallback(async (item) => {
    const linha = { ...item, organization_id: perfil.organization_id, worksite_id: obraId }
    const salvo = checar(await supabase.from('projects').upsert(linha).select('id').single(), 'salvar o projeto')
    if (salvo) {
      if (item.status === 'recebido') await registrarAuditoria('projeto recebido', 'project', salvo.id)
      await recarregar()
    }
    return salvo
  }, [perfil.organization_id, obraId, recarregar, registrarAuditoria])

  /* Impede ciclo: só deixa depender de algo que (direta ou
     indiretamente) não dependa do próprio projeto. */
  const criaCiclo = useCallback((projectId, dependeDeId) => {
    const visitar = (id, alvo) => {
      if (id === alvo) return true
      const deps = (tudo.projects.find((p) => p.id === id)?.dependencias || [])
      return deps.some((d) => visitar(d.depende_de_id, alvo))
    }
    return visitar(dependeDeId, projectId)
  }, [tudo])

  const adicionarDependencia = useCallback(async (projectId, dependeDeId) => {
    if (projectId === dependeDeId || criaCiclo(projectId, dependeDeId)) {
      setErro('Essa dependência criaria um ciclo (um projeto esperando por ele mesmo, direta ou indiretamente).')
      return false
    }
    const ok = checar(
      await supabase.from('project_dependencies').insert({ project_id: projectId, depende_de_id: dependeDeId }).select('id').single(),
      'adicionar a dependência',
    )
    if (ok) { await registrarAuditoria('dependência adicionada', 'project', projectId); await recarregar() }
    return Boolean(ok)
  }, [criaCiclo, recarregar, registrarAuditoria])

  const removerDependencia = useCallback(async (id) => {
    const ok = checar(await supabase.from('project_dependencies').delete().eq('id', id).select('id').single(), 'remover a dependência')
    if (ok) { await registrarAuditoria('dependência removida', 'project_dependency', id); await recarregar() }
    return Boolean(ok)
  }, [recarregar, registrarAuditoria])

  const salvarNotaProjeto = useCallback(async (projectId, texto) => {
    const ok = checar(
      await supabase.from('project_notes').insert({ project_id: projectId, texto, autor_id: perfil.id }).select('id').single(),
      'salvar a anotação',
    )
    if (ok) await recarregar()
    return Boolean(ok)
  }, [perfil.id, recarregar])

  const resolverNotaProjeto = useCallback(async (id, situacao) => {
    const ok = checar(await supabase.from('project_notes').update({ situacao }).eq('id', id).select('id').single(), 'mudar a anotação')
    if (ok) await recarregar()
    return Boolean(ok)
  }, [recarregar])

  /* Só grava quando a gestão confirma a simulação de atraso — até lá
     é só cálculo em memória, nada muda no banco. */
  const aplicarSimulacaoAtraso = useCallback(async (impactados) => {
    for (const item of impactados) {
      if (!item.dataSimulada) continue
      await supabase.from('projects').update({ data_prevista: item.dataSimulada }).eq('id', item.id)
      await registrarAuditoria('simulação de atraso aplicada', 'project', item.id, `nova data prevista: ${item.dataSimulada}`)
    }
    await recarregar()
  }, [recarregar, registrarAuditoria])

  const limparErro = useCallback(() => setErro(null), [])

  const valor = useMemo(() => ({
    perfil, tudo, daObra, obraId, setObraId, erro, recarregar,
    salvarCadastro, arquivarCadastro, salvarDiario, salvarPlanejado, removerPlanejado,
    salvarPendencia, mudarStatusPendencia,
    salvarItemCronograma, removerItemCronograma,
    salvarRequisicao, mudarStatusRequisicao, registrarRecebimento,
    salvarEquipamento, arquivarEquipamento,
    salvarProjeto, adicionarDependencia, removerDependencia, salvarNotaProjeto, resolverNotaProjeto, aplicarSimulacaoAtraso,
    limparErro,
  }), [
    perfil, tudo, daObra, obraId, erro, recarregar, salvarCadastro, arquivarCadastro, salvarDiario, salvarPlanejado, removerPlanejado,
    salvarPendencia, mudarStatusPendencia, salvarItemCronograma, removerItemCronograma,
    salvarRequisicao, mudarStatusRequisicao, registrarRecebimento,
    salvarEquipamento, arquivarEquipamento,
    salvarProjeto, adicionarDependencia, removerDependencia, salvarNotaProjeto, resolverNotaProjeto, aplicarSimulacaoAtraso,
    limparErro,
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
