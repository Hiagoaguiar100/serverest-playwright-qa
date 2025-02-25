import { test, expect } from '../support/fixtures.js';

test.describe('Interface ServeRest', () => {
  test('exibe o formulário de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Front - ServeRest/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('mostra erro ao tentar entrar com senha inválida', async ({ page, customer }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(customer.email);
    await page.locator('input[name="password"]').fill('senha-incorreta');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText(/Email e\/ou senha inválidos/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('cadastra conta pela interface e entra no sistema', async ({ page, request }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const account = { nome: 'QA Playwright UI', email: `qa.ui.${suffix}@example.com`, password: 'QaTest!2025' };
    let userId;

    try {
      await page.goto('/cadastrarusuarios');
      await page.locator('input[name="nome"]').fill(account.nome);
      await page.locator('input[name="email"]').fill(account.email);
      await page.locator('input[name="password"]').fill(account.password);
      const createdResponsePromise = page.waitForResponse(response =>
        response.url().endsWith('/usuarios') && response.request().method() === 'POST'
      );
      await page.getByRole('button', { name: 'Cadastrar' }).click();
      const createdResponse = await createdResponsePromise;
      expect(createdResponse.status()).toBe(201);
      userId = (await createdResponse.json())._id;
      await expect(page.getByText(/Cadastro realizado com sucesso/i)).toBeVisible();

      await page.goto('/login');
      await page.locator('input[name="email"]').fill(account.email);
      await page.locator('input[name="password"]').fill(account.password);
      await page.getByRole('button', { name: 'Entrar' }).click();
      await expect(page).toHaveURL(/\/home$/);
      await expect(page.getByText('Serverest Store')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    } finally {
      if (userId) await request.delete(`https://serverest.dev/usuarios/${userId}`);
    }
  });

  test('login leva ao catálogo e permite pesquisar e abrir um produto', async ({ page, customer }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(customer.email);
    await page.locator('input[name="password"]').fill(customer.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    const firstCard = page.locator('.card').first();
    await expect(firstCard).toBeVisible();
    const productName = (await firstCard.innerText()).split('\n')[0].trim();
    await page.getByPlaceholder('Pesquisar Produtos').fill(productName);
    await page.getByRole('button', { name: /Pesquisar/i }).click();
    const matchingCard = page.locator('.card').filter({ hasText: productName }).first();
    await expect(matchingCard).toBeVisible();
    await matchingCard.locator('a[data-testid="product-detail-link"][href^="/detalhesProduto/"]').first().click();
    await expect(page).toHaveURL(/\/detalhesProduto\//);
    await expect(page.locator('body')).toContainText(productName);
  });

  test('adiciona produto à lista de compras e altera a quantidade', async ({ page, customer }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(customer.email);
    await page.locator('input[name="password"]').fill(customer.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/home$/);

    const firstCard = page.locator('.card').first();
    const productName = (await firstCard.innerText()).split('\n').map(line => line.trim()).find(Boolean);
    await firstCard.getByRole('button', { name: /Adicionar a lista/i }).click();
    await page.getByTestId('lista-de-compras').click();
    await expect(page).toHaveURL(/\/minhaListaDeProdutos$/);
    await expect(page.getByRole('heading', { name: 'Lista de Compras' })).toBeVisible();
    await expect(page.locator('body')).toContainText(productName);
    await expect(page.locator('body')).toContainText('Total: 1');

    await page.getByRole('button', { name: '+' }).click();
    await expect(page.locator('body')).toContainText('Total: 2');
    await page.getByRole('button', { name: '-' }).click();
    await expect(page.locator('body')).toContainText('Total: 1');
  });

  test('logout encerra a sessão e volta para login', async ({ page, customer }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(customer.email);
    await page.locator('input[name="password"]').fill(customer.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/home$/);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
