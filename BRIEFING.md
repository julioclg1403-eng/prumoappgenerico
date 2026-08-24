# Briefing — Canteiro (base genérica)

Especificação funcional completa: ver `GUIA_RECRIAR_APP_SEM_DADOS_REAIS.md`
(uma pasta acima deste projeto). Este app é implementado a partir dela — sem
copiar código, banco ou dados do Prumo (o app da Fama). Nenhum nome de
empresa, obra, pessoa ou fornecedor real deve aparecer em código, seed,
commits ou documentação deste projeto.

## Identidade provisória

Nome de trabalho: **Canteiro**. Cor principal `#1f2a44` (azul-marinho neutro),
acento `#2f9e8f`. É só um placeholder — a marca final é definida por cliente
mais adiante.

## Perfis

- `campo` — mestre de obras / encarregado, interface simples e mobile-first.
- `gestao` — engenharia / coordenação / administração, mais completa no desktop.

(`admin` também existe como variação de `gestao` com acesso a Usuários — ver
migração de schema.)

## Progresso por fase (guia, seção 11)

- [x] **Fase 1 — Fundação**: repositório, ambientes, autenticação, `organizations`/
      `worksites`/`profiles` com RLS, layout responsivo dos dois perfis, design
      system base.
- [x] **Fase 2 — Operação diária**: cadastros auxiliares (empresas, colaboradores,
      locais, serviços), diário de obra (presença por equipe, frentes de serviço
      com equipe vinculada, ocorrências, rascunho/concluído), planejamento
      semanal, pendências (prioridade/prazo/status). Efetivo consolidado ainda
      não tem tela própria — hoje só é lido diário a diário.
- [x] **Fase 3 — Planejamento e suprimentos**: cronograma físico (com hierarquia,
      previsto x realizado, percentual), catálogo de materiais, requisições
      com fluxo completo (rascunho → enviado → cotação → aprovado → trânsito →
      recebido) e recebimento parcial que soma sem sobrescrever histórico.
      Vínculo automático planejamento/diário/cronograma e medições de pedidos
      ainda não entraram.
- [x] **Fase 4 — Gestão (parcial)**: projetos com dependências muitos-para-muitos
      (detecção de ciclo), sinais calculados (atrasado/sem prazo/aguardando
      dependência), anotações por projeto, simulação de atraso em cascata que
      só grava ao confirmar. Equipamentos com situação, local e alerta de
      devolução vencida/próxima. Contratações, visitas/reunião gerencial e
      galeria (depende de upload de arquivo, ainda não existe nesta base)
      ficaram de fora.
- [ ] Fase 5 — Saídas e qualidade (dashboard, PDFs/planilhas, notificações,
      auditoria, testes).

Cada fase deve terminar utilizável e testada antes de começar a próxima.
