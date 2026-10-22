# Margem

Diário de leitura livre e de código aberto, com cara de fichário de biblioteca. Você fotografa a capa do livro, guarda na estante, cronometra as sessões, anota ideias por voz e cria flashcards que o app agenda para revisão.

Sem conta, sem servidor e sem anúncios. Tudo fica no seu aparelho e funciona offline.

## Rodando

Precisa só do Node 18 ou mais novo. Não tem dependências para instalar.

```bash
npm run dev       # abre em http://localhost:5173
npm run build     # gera a pasta dist/ para publicar
npm run preview   # build + servidor estático da dist/
```

## Estrutura

```
margem/
├── src/
│   ├── index.html        marcação e telas fixas (abas, folhas, tela cheia)
│   ├── styles.css        visual completo, temas claro e escuro
│   ├── app.js            lógica do app: dados, telas, sessão, flashcards
│   └── sw.js             service worker (offline e cache das capas)
├── public/
│   ├── manifest.webmanifest
│   └── icons/            ícones do app instalado
├── scripts/
│   ├── dev.mjs           servidor local sem dependências
│   └── build.mjs         junta src/ e public/ em dist/
├── netlify.toml          build e cabeçalhos para o Netlify
└── LICENSE               MIT
```

### Mapa do `app.js`

| Bloco | O que faz |
| --- | --- |
| Armazenamento | IndexedDB `margem` com `kv/state` (dados) e `img/*` (fotos) |
| Dados de exemplo | `seed()` e `clearSamples()`, tudo marcado com `sample: true` |
| Números | ofensiva, recordes, XP, níveis e conquistas |
| Revisão espaçada | `nextState()`: SM-2 simplificado (Errei, Difícil, Bom, Fácil) |
| Views | `viewHome`, `viewShelf`, `viewBook`, `viewNotes`, `viewCards`, `viewStats`, `viewSettings` |
| Folhas | formulários de livro, nota, flashcard, confirmação |
| Sessão | cronômetro em tela cheia, pausa, validação pela página final |
| Ações | tudo que tem `data-a="..."` no HTML cai no objeto `ACT` |

## Funções

- Meta semanal com anel de progresso, faixa da semana e dias seguidos
- Estante em capas ou lombadas, com filtros por situação
- Foto da capa pela câmera, cor da lombada tirada da foto
- Busca por título ou ISBN (Open Library) e leitura do código de barras
- Sessão cronometrada com pausa, notas por voz e validação no fim
- Registro manual de leitura
- Notas e citações com foto do trecho, pastas, favoritas e busca
- Flashcards com revisão espaçada e "Virar flashcard" a partir de uma nota
- Estrelas, resenha e previsão de término por livro
- Calendário, gráfico por semana, mês e ano, meta anual, recordes
- XP, níveis e conquistas
- Tema claro, escuro ou do sistema
- Backup e restauração em JSON
- PWA instalável e offline

## Publicando

**Netlify com Git:** suba o repositório no GitHub e importe no Netlify. O `netlify.toml` já configura tudo.

**Netlify sem Git:** rode `npm run build` e arraste a pasta `dist/` em app.netlify.com/drop.

Depois, abra o link no Chrome do celular e toque em **Adicionar à tela inicial**. Câmera, microfone e código de barras precisam de HTTPS (ou localhost).

## Ideias para próximas versões

- Sincronização opcional (Supabase) entre aparelhos
- OCR da foto do trecho
- Gerar flashcards a partir das notas com IA
- Lembrete diário de leitura

## Licença

MIT
