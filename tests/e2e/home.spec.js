import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('AgroFloresta na Escola - Homepage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Acessa a página principal antes de cada teste
    await page.goto('/');
  });

  test('Deve carregar a página principal e exibir o título correto', async ({ page }) => {
    // Verifica o título da página
    await expect(page).toHaveTitle(/AgroFloresta na Escola | Vivências para o Amanhã/i);
    
    // Verifica se o elemento hero existe
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('AgroFloresta');
  });

  test('O menu mobile deve abrir ao clicar no botão hamburger', async ({ page }) => {
    // Esse teste é mais relevante em viewport mobile.
    // Vamos garantir o viewport para simular mobile:
    await page.setViewportSize({ width: 375, height: 667 });
    
    const menuBtn = page.locator('#menuToggle');
    const mobileNav = page.locator('#mobileNav');
    
    // Confirma que não está ativo inicialmente
    await expect(mobileNav).not.toHaveClass(/active/);
    
    // Clica no botão
    await menuBtn.click();
    
    // Deve ficar ativo
    await expect(mobileNav).toHaveClass(/active/);
  });

  test('Deve passar na auditoria básica de acessibilidade (axe)', async ({ page }) => {
    // Analisa a página atual em busca de violações de acessibilidade
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Para um projeto novo, esperamos 0 violações, mas como pode haver falhas nas placeholders,
    // podemos apenas logar ou asserter. Vamos asserter.
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Navegação para o jogo "Semeador" deve funcionar', async ({ page }) => {
    // Pega o botão principal na seção hero
    const gameLink = page.locator('.hero-ctas a[href="jogos/jogo1/index.html"]');
    await expect(gameLink).toBeVisible();
    await gameLink.click();
    
    // Verifica se fomos para a página do jogo
    await expect(page).toHaveURL(/.*jogos\/jogo1\/index\.html/);
    
    // Verifica título da página do jogo
    await expect(page).toHaveTitle(/Semeador - Agrofloresta/i);
  });
});
