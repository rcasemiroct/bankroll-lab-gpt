# Bankroll Lab GPT

PWA mobile-first para controle privado de banca, registro de apostas, gestão de risco, projeções e simulação Monte Carlo.

O app não recomenda apostas, não sugere entradas e não se conecta a casas de aposta. Todos os dados ficam no IndexedDB do próprio dispositivo, sem login, backend, analytics ou rastreadores.

## Rodar localmente

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Para gerar e revisar a versão de produção:

```bash
npm run build
npm run preview
```

Os testes das fórmulas e da simulação rodam com:

```bash
npm test
```

## Arquitetura

- `src/db`: banco IndexedDB via Dexie e dados demonstrativos opcionais.
- `src/lib/calculations.ts`: métricas financeiras, drawdown, streaks e análises por estratégia.
- `src/lib/monteCarlo.ts`: motor isolado de simulação.
- `src/lib/projections.ts`: cenários conservador, base e agressivo.
- `src/lib/alerts.ts`: regras de alertas internos.
- `src/lib/backup.ts`: exportação/importação, CSV, snapshots e provedores locais.
- `src/pages`: as cinco áreas principais e as seções de relatório, backup e configurações.
- `src/components/ui`: componentes shadcn/ui adaptados ao sistema visual do produto.

## Dados e backup

IndexedDB pode ser apagado pelo sistema, por limpeza do navegador ou por troca de aparelho. Use **Regras → Backups → Exportar backup agora** e salve o JSON em Arquivos, iCloud Drive, Google Drive ou outro local seguro.

Na importação, o app valida o schema, exibe uma prévia e cria um snapshot local antes de substituir ou mesclar dados.

## Instalar no iPhone

1. Publique o app em HTTPS, por exemplo com GitHub Pages.
2. Abra a URL no Safari do iPhone.
3. Toque em **Compartilhar**.
4. Escolha **Adicionar à Tela de Início**.
5. Confirme **Adicionar**.

Depois da primeira abertura online, o service worker mantém a interface disponível offline. Os dados permanecem apenas no dispositivo em que foram registrados.

## Publicar no GitHub Pages

O projeto já usa caminhos relativos (`base: "./"`) e inclui o workflow `.github/workflows/deploy.yml`.

1. Crie um repositório no GitHub e envie os arquivos.
2. Em **Settings → Pages**, selecione **GitHub Actions** como fonte.
3. Envie uma alteração para a branch `main`.
4. Aguarde o workflow **Deploy Bankroll Lab to Pages** terminar.

A publicação deste projeto ficará em `https://rcasemiroct.github.io/bankroll-lab-gpt/`.

## Limites desta versão

- Não há backup automático em nuvem.
- Não há notificações push externas.
- A simulação depende integralmente das premissas informadas.
- Projeção não é previsão; resultados recentes não provam edge.

## Próximos passos

- Criptografia opcional do arquivo de backup.
- Testes end-to-end em Safari/iOS real.
- Provedores futuros de backup em nuvem, sempre opcionais e privados.
- Alertas locais do sistema somente após revisão explícita de privacidade.
