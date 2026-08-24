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
- [ ] Fase 3 — Planejamento e suprimentos (cronograma físico, requisições,
      cotação/compra/recebimento, medições).
- [ ] Fase 4 — Gestão (projetos e dependências, contratações, reuniões,
      equipamentos, galeria).
- [ ] Fase 5 — Saídas e qualidade (dashboard, PDFs/planilhas, notificações,
      auditoria, testes).

Cada fase deve terminar utilizável e testada antes de começar a próxima.
