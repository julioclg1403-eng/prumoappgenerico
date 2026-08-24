import { describe, it, expect } from 'vitest'
import {
  saldoPendente, requisicaoRecebidaPorCompleto, pendenciasAtrasadas, pendenciasEmAberto,
  projetoAtrasado, projetoSemPrazo, projetoAguardandoDependencia, simularAtraso,
  equipamentoVencido, hojeISO, somarDias,
} from './dominio'

describe('saldoPendente', () => {
  it('desconta o que já foi recebido', () => {
    expect(saldoPendente({ quantidade: 50, quantidade_recebida: 30 })).toBe(20)
  })
  it('nunca fica negativo mesmo se receber a mais', () => {
    expect(saldoPendente({ quantidade: 50, quantidade_recebida: 999 })).toBe(0)
  })
})

describe('requisicaoRecebidaPorCompleto', () => {
  it('falso enquanto algum item tem saldo', () => {
    const r = { itens: [{ quantidade: 10, quantidade_recebida: 5 }] }
    expect(requisicaoRecebidaPorCompleto(r)).toBe(false)
  })
  it('verdadeiro quando todos os itens fecharam o saldo', () => {
    const r = { itens: [{ quantidade: 10, quantidade_recebida: 10 }, { quantidade: 5, quantidade_recebida: 5 }] }
    expect(requisicaoRecebidaPorCompleto(r)).toBe(true)
  })
  it('falso sem nenhum item (não existe "completo" do nada)', () => {
    expect(requisicaoRecebidaPorCompleto({ itens: [] })).toBe(false)
  })
})

describe('pendências', () => {
  const hoje = hojeISO()
  const ontem = somarDias(hoje, -1)
  const amanha = somarDias(hoje, 1)
  const issues = [
    { status: 'aberta', prazo: ontem },
    { status: 'aberta', prazo: amanha },
    { status: 'aberta', prazo: null },
    { status: 'resolvida', prazo: ontem },
  ]
  it('em aberto inclui as sem prazo e as com prazo futuro', () => {
    expect(pendenciasEmAberto(issues)).toHaveLength(3)
  })
  it('atrasada é só a que está aberta E com prazo vencido', () => {
    const atrasadas = pendenciasAtrasadas(issues)
    expect(atrasadas).toHaveLength(1)
    expect(atrasadas[0].prazo).toBe(ontem)
  })
})

describe('sinais de projeto', () => {
  const hoje = hojeISO()
  it('atrasado: tem prazo vencido e não foi recebido', () => {
    expect(projetoAtrasado({ status: 'nao_iniciado', data_prevista: somarDias(hoje, -5) })).toBe(true)
  })
  it('não atrasado se já foi recebido, mesmo com prazo vencido', () => {
    expect(projetoAtrasado({ status: 'recebido', data_prevista: somarDias(hoje, -5) })).toBe(false)
  })
  it('sem prazo: não tem data prevista e não foi recebido', () => {
    expect(projetoSemPrazo({ status: 'em_andamento', data_prevista: null })).toBe(true)
  })
  it('aguardando dependência: alguma dependência ainda não foi recebida', () => {
    const projetos = [{ id: '1', status: 'em_andamento' }, { id: '2', status: 'recebido' }]
    const p = { id: '3', dependencias: [{ depende_de_id: '1' }, { depende_de_id: '2' }] }
    expect(projetoAguardandoDependencia(p, projetos)).toBe(true)
  })
  it('não aguarda se todas as dependências já foram recebidas', () => {
    const projetos = [{ id: '1', status: 'recebido' }]
    const p = { id: '2', dependencias: [{ depende_de_id: '1' }] }
    expect(projetoAguardandoDependencia(p, projetos)).toBe(false)
  })
})

describe('simularAtraso', () => {
  it('empurra em cascata só quem depende (direta ou indiretamente) do projeto atrasado', () => {
    const projetos = [
      { id: 'fundacao', titulo: 'Fundação', data_prevista: '2026-01-01', dependencias: [] },
      { id: 'estrutura', titulo: 'Estrutura', data_prevista: '2026-02-01', dependencias: [{ depende_de_id: 'fundacao' }] },
      { id: 'acabamento', titulo: 'Acabamento', data_prevista: '2026-03-01', dependencias: [{ depende_de_id: 'estrutura' }] },
      { id: 'paisagismo', titulo: 'Paisagismo', data_prevista: '2026-04-01', dependencias: [] },
    ]
    const impacto = simularAtraso('fundacao', 10, projetos)
    const ids = impacto.map((i) => i.id)
    expect(ids).toContain('estrutura')
    expect(ids).toContain('acabamento') // indireto, via estrutura
    expect(ids).not.toContain('paisagismo') // não depende de nada aqui
    expect(impacto.find((i) => i.id === 'estrutura').dataSimulada).toBe('2026-02-11')
  })
})

describe('equipamentoVencido', () => {
  it('vencido só se em uso e a data já passou', () => {
    expect(equipamentoVencido({ situacao: 'ativo', previsao_devolucao: somarDias(hojeISO(), -1) })).toBe(true)
  })
  it('não vencido se já foi devolvido, mesmo com data passada', () => {
    expect(equipamentoVencido({ situacao: 'devolvido', previsao_devolucao: somarDias(hojeISO(), -1) })).toBe(false)
  })
})
