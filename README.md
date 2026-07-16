# WB Project Manager

[![CI](https://github.com/wbrunovieira/WB-project-manager/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/wbrunovieira/WB-project-manager/actions/workflows/ci.yml)
[![CD](https://github.com/wbrunovieira/WB-project-manager/actions/workflows/deploy.yml/badge.svg)](https://github.com/wbrunovieira/WB-project-manager/actions/workflows/deploy.yml)

Gerenciador de projetos com issue tracking, time tracking e monitoramento de SLA. Em produção em [projects.wbdigitalsolutions.com](https://projects.wbdigitalsolutions.com).

## Stack

- **Next.js 15** (App Router, standalone output) + **React 19** + TypeScript
- **Prisma 6** com SQLite
- **NextAuth v5** (JWT, credentials provider)
- **Tailwind CSS 4** + shadcn/ui + @dnd-kit (drag-and-drop)
- **Vitest** + happy-dom para testes
- **pnpm** como package manager (pinado via `packageManager` no package.json)

## Funcionalidades

- **Workspaces → Projetos → Issues** com papéis (Owner/Admin/Member/Guest), labels e statuses
- **Issues** com tipos (feature, bug, manutenção, melhoria), prioridades, milestones e reordenação drag-and-drop
- **Time tracking** em tempo real com timer flutuante global
- **SLA** calculado em horas úteis (seg–sex, 9h–18h): primeira resposta e resolução por tipo/prioridade, com status verde/amarelo/vermelho
- **API externa** com autenticação por API key (Bearer) e criação de issues em lote

## Desenvolvimento

```bash
cp .env.example .env          # configure DATABASE_URL, AUTH_SECRET etc.
pnpm install
pnpm exec prisma migrate dev  # cria o banco e aplica migrations
pnpm db:seed                  # dados iniciais
pnpm dev                      # http://localhost:3000
```

### Testes e qualidade

```bash
pnpm test -- --run    # todos os testes (uma vez)
pnpm test:unit        # só unit tests
pnpm test:coverage    # com cobertura
pnpm lint             # eslint
pnpm build            # build de produção
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`): a cada push/PR na `main` roda lint, testes unitários (Vitest) e build.
- **CD** (`.github/workflows/deploy.yml`): quando o CI fica verde na `main`, dispara o deploy para o VPS via Ansible — **com aprovação manual obrigatória** no environment `production`. O deploy faz `git pull` + rebuild do Docker no servidor; as migrations do Prisma rodam automaticamente no boot do container.

O deploy também pode ser executado localmente:

```bash
cd deploy/ansible
ansible-playbook playbooks/quick-deploy.yml --vault-password-file <arquivo>
```

## Docker

Build multi-stage (`Dockerfile`): pnpm via corepack (Node 24) para deps/build, Next.js standalone no runner, e um estágio dedicado `prisma-cli` que fornece o CLI do Prisma para `migrate deploy` no entrypoint.

```bash
docker build -t wb-project-manager .
docker run -p 3002:3002 -e DATABASE_URL=file:/app/data/prod.db -e AUTH_SECRET=... wb-project-manager
```
