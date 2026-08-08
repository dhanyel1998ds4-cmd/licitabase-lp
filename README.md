# Licitabase

Landing page responsiva do Licitabase, adaptada sobre a estrutura visual existente. A implementação usa HTML semântico, CSS e módulos JavaScript de progressive enhancement, sem dependências de instalação.

## Run

```powershell
npm run dev
```

Rotas locais:

- Dark: `http://127.0.0.1:4173/`
- Light: `http://127.0.0.1:4173/light/`
- Comparação dark: `http://127.0.0.1:4173/planos/comparar`
- Comparação light: `http://127.0.0.1:4173/light/planos/comparar`

## Verification

```powershell
npm run check
```

O QA em navegador está em `scripts/verify-implementation.cjs`; ele usa Playwright do runtime do workspace e grava os resultados no diretório ignorado `verification/`.

O teste integral das variantes dark/light está em `scripts/verify-light-theme.cjs` e valida as rotas, os ativos tematizados, a continuidade do ciclo dos planos e a ausência de overflow entre 320 e 1440 px.

## Asset note

Os ativos principais das duas variantes são locais. A página permanece funcional sem JavaScript; o JavaScript acrescenta apenas os comportamentos progressivos, animações e a troca dos ativos da variante light.

See [ANALYSIS.md](./ANALYSIS.md) for the engineering-reverse report, design tokens, responsive matrix, and validation results.
