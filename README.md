# extrato-dash

Dashboard para visualização de extratos bancários pessoais, construído com HTML, CSS e JavaScript puro — sem frameworks ou dependências de build.

## Funcionalidades

- Seletor de **pessoa** e **mês** com carregamento dinâmico
- Cards de resumo: entradas, saídas, saldo e total de lançamentos (categoria `Investimento` excluída do saldo)
- Filtro por categoria com badges coloridos gerados dinamicamente
- Ordenação clicável em todas as colunas
- Exibição de parcelas (`3/12`) quando disponível
- Paleta de 15 cores intercaladas — cada categoria recebe uma cor distinta automaticamente
- Dados carregados via `fetch()` a partir de JSONs locais — zero dado hardcoded no HTML

## Primeiros passos com o sample data

O repositório inclui um `data-sample/` com dois perfis fictícios (Person 1 e Person 2), dois meses cada, cobrindo todas as funcionalidades: parcelas, categoria `Investimento`, múltiplos bancos, entradas e saídas.

**Para rodar o projeto imediatamente:**

```bash
# 1. Copie o sample para a pasta data/ (git-ignorada)
cp -r data-sample/ data/

# 2. Suba o servidor
bash scripts/00_start_dev.sh
```

**Quando quiser usar seus próprios dados:**
1. Use os arquivos em `data-sample/` como referência de schema
2. Delete o conteúdo de `data/` e crie suas próprias pastas e JSONs
3. O `data-sample/` permanece no repo para consulta — não o apague

> `data/` é git-ignorado para proteger dados financeiros reais. `data-sample/` é versionado justamente para servir como ponto de partida.

## Como rodar

```bash
bash scripts/00_start_dev.sh          # abre em localhost (porta 8000)
bash scripts/00_start_dev.sh 3000     # porta customizada
```

Requer Node.js instalado (`npx serve`). A aplicação **precisa** ser servida via HTTP — abrir `index.html` diretamente como `file://` quebra o `fetch()`.

## Estrutura

```
extrato-dash/
├── index.html
├── css/style.css
├── js/dashboard.js
├── scripts/
│   └── 00_start_dev.sh
├── data-sample/                       # dados fictícios de exemplo (versionado)
│   ├── manifest.json
│   ├── person1/
│   │   ├── manifest.json
│   │   ├── 2026-04.json
│   │   └── 2026-05.json
│   └── person2/
│       ├── manifest.json
│       ├── 2026-04.json
│       └── 2026-05.json
└── data/                              # git-ignorado (seus dados financeiros reais)
    ├── manifest.json
    └── {pessoa}/
        ├── manifest.json
        └── YYYY-MM.json
```

## Adicionar dados

**Novo mês:**
1. Crie `data/{pessoa}/YYYY-MM.json` (nome livre, desde que bata com o manifest)
2. Adicione a entrada em `data/{pessoa}/manifest.json`

**Nova pessoa:**
1. Crie a pasta `data/{pessoa}/` com os JSONs e o `manifest.json`
2. Adicione a entrada em `data/manifest.json`

## Schema

**`data/manifest.json`**
```json
{
  "pessoas": [
    { "label": "Pessoa", "folder": "pessoa" }
  ]
}
```

**`data/{pessoa}/manifest.json`**
```json
{
  "arquivos": [
    { "label": "Maio 2026", "file": "2026-05.json" }
  ]
}
```

**`data/{pessoa}/YYYY-MM.json`**
```json
{
  "meta": {
    "titular": "string",
    "bancos": ["Banco 1", "Banco 2"],
    "contas": [
      { "banco": "Banco", "agencia": "0000", "conta": "000000-0" }
    ],
    "periodo": { "inicio": "YYYY-MM-DD", "fim": "YYYY-MM-DD" },
    "gerado_em": "YYYY-MM-DD"
  },
  "categorias_validas": ["Recebimento", "Moradia", "Investimento", "..."],
  "lancamentos": [
    {
      "data": "YYYY-MM-DD",
      "nome_original": "string",
      "nome_simplificado": "string",
      "categoria": "string",
      "valor": -150.00,
      "origem": "string",
      "parcela_atual": 3,
      "parcelas_total": 12
    }
  ]
}
```

`valor` negativo = despesa, positivo = entrada. `parcela_atual` / `parcelas_total` são opcionais.

## Stack

- HTML5 / CSS3 (variáveis CSS, grid, flexbox)
- JavaScript ES2020 (fetch, Set, CSS.escape)
- [DM Sans + DM Mono](https://fonts.google.com/) via Google Fonts
- Sem frameworks, sem build step
