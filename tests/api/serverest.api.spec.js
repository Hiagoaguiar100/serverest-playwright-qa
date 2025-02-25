import { test, expect } from '../support/fixtures.js';

const API_URL = process.env.API_URL ?? 'https://serverest.dev';

test.describe('API ServeRest', () => {
  test('lista produtos e permite consultar um produto pelo ID', async ({ request }) => {
    const list = await request.get(`${API_URL}/produtos`);
    expect(list.status()).toBe(200);
    const body = await list.json();
    expect(body.quantidade).toBeGreaterThan(0);
    expect(body.produtos.length).toBeGreaterThan(0);

    const product = body.produtos[0];
    const detail = await request.get(`${API_URL}/produtos/${product._id}`);
    expect(detail.status()).toBe(200);
    expect(await detail.json()).toMatchObject({ _id: product._id, nome: product.nome });
  });

  test('cadastra usuário, localiza por email e autentica', async ({ request }) => {
    const payload = {
      nome: 'QA Playwright API',
      email: `qa.api.${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      password: 'QaTest!2025',
      administrador: 'false',
    };
    const registration = await request.post(`${API_URL}/usuarios`, { data: payload });
    expect(registration.status()).toBe(201);
    const created = await registration.json();
    expect(created.message).toContain('Cadastro realizado com sucesso');

    try {
      const search = await request.get(`${API_URL}/usuarios`, { params: { email: payload.email } });
      expect(search.status()).toBe(200);
      expect((await search.json()).usuarios[0]).toMatchObject({ email: payload.email, administrador: 'false' });

      const login = await request.post(`${API_URL}/login`, { data: { email: payload.email, password: payload.password } });
      expect(login.status()).toBe(200);
      expect((await login.json()).authorization).toMatch(/^Bearer\s+\S+/);
    } finally {
      await request.delete(`${API_URL}/usuarios/${created._id}`);
    }
  });

  test('rejeita cadastro duplicado e credenciais inválidas', async ({ request, customer }) => {
    const duplicate = await request.post(`${API_URL}/usuarios`, {
      data: { nome: customer.nome, email: customer.email, password: customer.password, administrador: customer.administrador },
    });
    expect(duplicate.status()).toBe(400);
    expect((await duplicate.json()).message).toMatch(/email.*(usado|utilizado)/i);

    const invalidLogin = await request.post(`${API_URL}/login`, {
      data: { email: customer.email, password: 'senha-incorreta' },
    });
    expect(invalidLogin.status()).toBe(401);
    expect((await invalidLogin.json()).message).toMatch(/inválidos/i);
  });

  test('bloqueia carrinho sem autenticação', async ({ request }) => {
    const productsResponse = await request.get(`${API_URL}/produtos`);
    const [{ _id }] = (await productsResponse.json()).produtos;
    const response = await request.post(`${API_URL}/carrinhos`, {
      data: { produtos: [{ idProduto: _id, quantidade: 1 }] },
    });
    expect(response.status()).toBe(401);
    expect((await response.json()).message).toMatch(/token/i);
  });

  test('cliente autenticado cria carrinho e cancela a compra', async ({ request, customer }) => {
    const login = await request.post(`${API_URL}/login`, { data: { email: customer.email, password: customer.password } });
    expect(login.status()).toBe(200);
    const { authorization } = await login.json();
    const productsResponse = await request.get(`${API_URL}/produtos`);
    const [{ _id: idProduto }] = (await productsResponse.json()).produtos;

    const cart = await request.post(`${API_URL}/carrinhos`, {
      headers: { authorization },
      data: { produtos: [{ idProduto, quantidade: 1 }] },
    });
    expect(cart.status()).toBe(201);
    expect((await cart.json()).message).toMatch(/sucesso/i);

    const cancellation = await request.delete(`${API_URL}/carrinhos/cancelar-compra`, { headers: { authorization } });
    expect(cancellation.status()).toBe(200);
    expect((await cancellation.json()).message).toMatch(/sucesso/i);
  });
});
