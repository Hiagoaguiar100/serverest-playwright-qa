import { test as base, expect } from '@playwright/test';

export const API_URL = process.env.API_URL ?? 'https://serverest.dev';

export function makeCustomer() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    nome: 'QA Playwright',
    email: `qa.playwright.${suffix}@example.com`,
    password: 'QaTest!2025',
    administrador: 'false',
  };
}

export const test = base.extend({
  customer: async ({ request }, use) => {
    const data = makeCustomer();
    const response = await request.post(`${API_URL}/usuarios`, { data });
    expect(response.status(), 'A API deve permitir cadastrar o usuário isolado do teste').toBe(201);
    const result = await response.json();
    await use({ ...data, id: result._id });
    await request.delete(`${API_URL}/usuarios/${result._id}`);
  },
});

export { expect };
