<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Análise Detalhada do Repositório Gerador de Propostas Rakta

Analisei o repositório [gerador_proposta_rakta](https://github.com/andradmarcel/gerador_proposta_rakta) em profundidade. É um projeto bem ambicioso para geração de propostas comerciais e contratos, com ~6.000 linhas de código e integração com IA.

## Melhorias Prioritárias

### 🔴 Prioridade CRÍTICA

#### 1. Segurança da API Key do Gemini

**Problema**: A chave da API do Gemini é armazenada diretamente no `localStorage` do navegador, tornando-a acessível a qualquer script executado na página.

**Solução**:

- Implementar um backend simples (Node.js/Express ou Cloudflare Workers) para proxy das chamadas à API
- Armazenar a chave no servidor via variáveis de ambiente
- Cliente envia requisições para seu backend, que adiciona a chave antes de chamar o Gemini
- Alternativamente: usar autenticação de usuário e associar chaves por conta

**Impacto**: Protege contra vazamento de credenciais e uso não autorizado da sua quota da API.

#### 2. Refatoração da Arquitetura Monolítica

**Problema**: Todo o código JavaScript está em um único arquivo `app.js` com 3.353 linhas. Isso torna impossível testar, dificulta manutenção e aumenta acoplamento.

**Solução** - Modularizar em:

```
src/
├── core/
│   ├── state.js          // Gerenciamento de estado
│   └── storage.js        // localStorage wrapper
├── services/
│   ├── gemini.js         // Integração IA
│   ├── pdf-generator.js  // Geração de PDF
│   └── contract.js       // Lógica de contrato
├── ui/
│   ├── themes.js         // Sistema de temas
│   ├── preview.js        // Preview de slides
│   └── forms.js          // Validação de formulários
├── utils/
│   ├── currency.js       // Formatação de valores
│   └── dates.js          // Cálculos de data
└── main.js              // Orquestração
```

**Benefícios**:

- Permite testes unitários
- Facilita trabalho em equipe
- Reduz bugs por isolamento de responsabilidades
- Possibilita tree-shaking no build


#### 3. Otimização de Assets

**Problema**: 7 imagens PNG pesam ~13.1 MB no total (1.8-2.5 MB cada). Isso impacta drasticamente o tempo de carregamento.

**Solução**:

- Converter para WebP (redução de 70-80% no tamanho)
- Implementar lazy loading para imagens não visíveis
- Gerar versões responsivas (srcset) para diferentes dispositivos
- Considerar usar SVG para backgrounds simples
- Adicionar um CDN (Cloudflare, Vercel) para cache

**Exemplo**:

```bash
# Converter para WebP
for img in assets/*.png; do
  cwebp -q 85 "$img" -o "${img%.png}.webp"
done
```


### 🟠 Prioridade ALTA

#### 4. Eliminar Duplicação de Código

**Problema**: O mesmo bloco HTML inline para estilização de "bônus" se repete 10+ vezes no código.

**Solução** - Criar funções helper:

```javascript
// utils/formatters.js
export function formatServicePrice(service) {
  if (service.isBonus) {
    return `
      <span class="price-strikethrough">${formatCurrency(service.price)}</span>
      <span class="badge-bonus">BÔNUS</span>
    `;
  }
  return '<i class="fa-solid fa-circle-check"></i> Incluso';
}
```

Mover estilos para CSS:

```css
.price-strikethrough {
  text-decoration: line-through;
  color: rgba(255,255,255,0.4);
  font-size: 10px;
  margin-right: 8px;
}

.badge-bonus {
  background: rgba(21, 128, 61, 0.15);
  color: #15803d;
  /* ... */
}
```


#### 5. Separação de Concerns (CSS/JS)

**Problema**: 64 manipulações diretas de `.style` no JavaScript. Isso mistura apresentação com lógica.

**Solução**:

- Usar classes CSS ao invés de estilos inline
- Implementar sistema de utility classes (tipo Tailwind, mas menor)
- Mover animações e transições para CSS

**Antes**:

```javascript
element.style.color = "red";
element.style.display = "none";
```

**Depois**:

```javascript
element.classList.add('text-error', 'hidden');
```


#### 6. Validação e Sanitização de Inputs

**Problema**: 32 ocorrências de `innerHTML` sem validação prévia. Risco de XSS se houver campos que aceitem entrada do usuário.

**Solução**:

```javascript
// utils/sanitize.js
import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
    ALLOWED_ATTR: ['class']
  });
}

// Validação de CNPJ
export function validateCNPJ(cnpj) {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  // ... algoritmo de validação
  return true;
}
```


#### 7. Implementar Testes Automatizados

**Problema**: Zero cobertura de testes.

**Solução** - Começar com:

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/dom": "^9.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

Priorizar testes para:

- `calculateTotals()` - cálculos críticos de preço
- `formatCurrency()` - formatação de valores
- `validateCNPJ()` - validação de dados
- Integração com Gemini (mocked)


### 🟡 Prioridade MÉDIA

#### 8. Gerenciamento de Dependências

**Problema**: Biblioteca `html2pdf.bundle.min.js` (905 KB) está commitada no repositório.

**Solução**:

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1"
  }
}
```

Remover do Git e adicionar ao `.gitignore`:

```gitignore
node_modules/
dist/
*.log
.env
.DS_Store
```


#### 9. Melhorias de Performance

**Problema**: 55 event listeners ativos, muitos deles disparando `updatePreview()` que manipula DOM pesadamente.

**Solução implementada (já existe debounce)** ✅:
O commit mais recente já implementou debouncing. Próximos passos:

- Implementar virtual scrolling para listas grandes de serviços
- Usar `requestAnimationFrame` para atualizações visuais
- Considerar React ou Vue para diff virtual do DOM


#### 10. Responsividade e Mobile

**Problema**: Apenas 2 media queries no CSS. Interface provavelmente não funciona bem em mobile.

**Solução**:

```css
/* Breakpoints modernos */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  .control-sidebar {
    width: 100%;
    height: auto;
  }
}

@media (max-width: 480px) {
  /* Ajustes para telas muito pequenas */
}
```


### 🟢 Prioridade BAIXA (Polish)

#### 11. SEO e Meta Tags

Adicionar ao `<head>`:

```html
<meta name="description" content="Gerador de propostas comerciais e contratos para a Rakta Lab">
<meta property="og:title" content="Gerador de Propostas Rakta">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```


#### 12. CI/CD e Quality Gates

Criar `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```


#### 13. Melhorias na Documentação

- Adicionar `CONTRIBUTING.md` com guia de desenvolvimento
- Documentar API do Gemini e estrutura de dados
- Screenshots no README
- Changelog estruturado (seguir [Keep a Changelog](https://keepachangelog.com/))


#### 14. Logging e Monitoring

Substituir `console.error` por sistema estruturado:

```javascript
// utils/logger.js
export const logger = {
  error: (context, error) => {
    // Em produção: enviar para Sentry/LogRocket
    // Em dev: console detalhado
    if (import.meta.env.PROD) {
      Sentry.captureException(error, { contexts: { custom: context } });
    } else {
      console.error(`[${context}]`, error);
    }
  }
}
```


## Roadmap Sugerido

**Semana 1-2**: Críticos

1. Setup do backend para API proxy
2. Começar refatoração em módulos (core primeiro)
3. Otimizar imagens

**Semana 3-4**: Altos
4. Eliminar duplicação de código
5. Implementar testes básicos
6. Sanitização de inputs

**Semana 5-6**: Médios
7. Melhorar responsividade
8. Migrar dependências
9. Performance adicional

**Backlog**: Baixos (quando tiver tempo)

## Métricas do Projeto

| Métrica | Valor | Status |
| :-- | :-- | :-- |
| Linhas de código | 5.967 | ⚠️ Grande para monolito |
| Tamanho de assets | 13.1 MB | 🔴 Muito pesado |
| Event listeners | 55 | ⚠️ Gerenciamento manual |
| Cobertura de testes | 0% | 🔴 Crítico |
| Dependências npm | 1 (Vite) | ✅ Minimalista |
| Media queries | 2 | 🔴 Não responsivo |

O projeto tem uma base sólida e funcional, mas precisa de refatoração arquitetural urgente para escalar. As melhorias prioritárias vão torná-lo mais seguro, performático e manutenível para o time da Rakta.

