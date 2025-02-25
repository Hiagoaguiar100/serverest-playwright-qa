# Testes de QA com Playwright — ServeRest

Projeto de automação em JavaScript para a interface de [front.serverest.dev](https://front.serverest.dev) e a API pública [serverest.dev](https://serverest.dev).

## Cobertura

- Interface: formulário, login inválido, cadastro pelo site, autenticação bem-sucedida, catálogo, busca, detalhes do produto, lista de compras, quantidade de itens e logout.
- API: consulta e filtro de produtos, consulta de usuários por ID, cadastro, duplicidade, autenticação válida/inválida, permissões de usuário comum e fluxo de carrinho.
- Os testes usam e-mails aleatórios e limpam os usuários criados quando possível. O serviço público apaga dados periodicamente e pode variar durante execuções.

## Requisitos

- Node.js 20 ou superior
- Acesso à internet

## Instalação e execução

No VS Code, escolha **Arquivo → Abrir Pasta...** e selecione a pasta `serverest-playwright-qa`. Abra o terminal integrado nessa pasta e rode:

```bash
npm install
npx playwright install chromium
npm test
```

Também é possível executar as mesmas ações pelo menu **Terminal → Executar Tarefa...**. O projeto inclui tarefas para instalar dependências, instalar o Chromium, rodar todos os testes, rodar apenas interface/API e abrir o relatório.

Executar somente interface ou API:

```bash
npm run test:e2e
npm run test:api
```

Abrir o relatório HTML da última execução:

```bash
npm run report
```

Para apontar os testes de API a uma instância local do ServeRest, defina `API_URL` (padrão: `https://serverest.dev`). A interface permanece apontada ao front público, definido no `playwright.config.js`.

## Estrutura

```text
tests/
  api/       testes REST
  e2e/       testes da interface
  support/   dados e fixture para criar/remover usuário de teste
playwright.config.js
```

## Observações

- Os cenários usam contas não administradoras. Rotas administrativas de produtos não fazem parte desta suíte.
- O ambiente online é compartilhado; produtos e resultados de listagem podem mudar. As verificações evitam depender da ordem fixa do catálogo.
- As senhas de teste são sintéticas e ficam apenas no código de teste em memória durante a execução; não use dados reais.
