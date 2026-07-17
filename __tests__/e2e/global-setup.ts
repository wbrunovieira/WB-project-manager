import { execSync, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { TestProject } from 'vitest/node'

/**
 * Global setup do E2E:
 * 1. `pnpm build` (sempre — o código pode ter mudado desde o último build)
 * 2. SQLite temporário + `prisma migrate deploy`
 * 3. Seed mínimo próprio (user OWNER de um workspace, statuses, project)
 * 4. Sobe o servidor de produção real (.next/standalone/server.js) com
 *    API_KEY/API_KEY_USER_ID (fail-closed: sem o user id a key é rejeitada)
 * 5. Espera /api/health == 200; teardown mata o processo e apaga o banco
 */

const PORT = 3100
const BASE_URL = `http://127.0.0.1:${PORT}`
const API_KEY = 'e2e-test-key'

export interface E2EContext {
  baseUrl: string
  apiKey: string
  userId: string
  workspaceId: string
  projectId: string
  statusTodoId: string
  statusInProgressId: string
  statusDoneId: string
}

declare module 'vitest' {
  export interface ProvidedContext {
    e2e: E2EContext
  }
}

export default async function setup(project: TestProject) {
  const root = process.cwd()
  let server: ChildProcess | undefined
  let tempDir: string | undefined

  try {
    // 1. Build de produção (mesmo modo do deploy: output standalone)
    execSync('pnpm build', { cwd: root, stdio: 'inherit' })

    // 2. Banco temporário + migrations
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-e2e-'))
    const databaseUrl = `file:${path.join(tempDir, 'e2e.db')}`
    execSync('pnpm exec prisma migrate deploy', {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    })

    // 3. Seed mínimo próprio do e2e (não depende do seed oficial)
    const { PrismaClient } = await import('../../src/generated/prisma')
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    })

    let context: E2EContext
    try {
      const user = await prisma.user.create({
        data: {
          email: 'e2e-agent@wb.test',
          name: 'E2E Agent',
          password: 'not-used-in-e2e',
        },
      })

      // O user PRECISA ser membro do workspace, senão toda rota devolve 403.
      const workspace = await prisma.workspace.create({
        data: {
          name: 'E2E Workspace',
          slug: 'e2e-workspace',
          members: {
            create: { userId: user.id, role: 'OWNER' },
          },
        },
      })

      const todo = await prisma.status.create({
        data: { name: 'Todo', type: 'TODO', position: 0, color: '#64748b', workspaceId: workspace.id },
      })
      const inProgress = await prisma.status.create({
        data: { name: 'In Progress', type: 'IN_PROGRESS', position: 1, color: '#3b82f6', workspaceId: workspace.id },
      })
      const done = await prisma.status.create({
        data: { name: 'Done', type: 'DONE', position: 2, color: '#10b981', workspaceId: workspace.id },
      })

      const proj = await prisma.project.create({
        data: { name: 'E2E Project', workspaceId: workspace.id },
      })

      context = {
        baseUrl: BASE_URL,
        apiKey: API_KEY,
        userId: user.id,
        workspaceId: workspace.id,
        projectId: proj.id,
        statusTodoId: todo.id,
        statusInProgressId: inProgress.id,
        statusDoneId: done.id,
      }
    } finally {
      await prisma.$disconnect()
    }

    // 4. Servidor de produção real
    server = spawn('node', ['.next/standalone/server.js'], {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(PORT),
        HOSTNAME: '127.0.0.1',
        DATABASE_URL: databaseUrl,
        API_KEY,
        // Fail-closed: sem esse env, Bearer válido recebe 401.
        API_KEY_USER_ID: context.userId,
        AUTH_SECRET: 'e2e-dummy-auth-secret',
        AUTH_TRUST_HOST: 'true',
        NEXTAUTH_URL: BASE_URL,
        ALLOWED_ORIGIN: 'http://localhost:3001',
      },
    })

    // 5. Espera o health check (que também valida o acesso ao SQLite temp)
    await waitForHealth(server)

    project.provide('e2e', context)
  } catch (error) {
    await stopServer(server)
    removeTempDir(tempDir)
    throw error
  }

  // Teardown
  return async () => {
    await stopServer(server)
    removeTempDir(tempDir)
  }
}

async function waitForHealth(server: ChildProcess): Promise<void> {
  const deadline = Date.now() + 60_000
  let exited = false
  server.once('exit', () => {
    exited = true
  })

  while (Date.now() < deadline) {
    if (exited) {
      throw new Error('[e2e] servidor standalone terminou antes do health check')
    }
    try {
      const res = await fetch(`${BASE_URL}/api/health`)
      if (res.status === 200) return
    } catch {
      // servidor ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error('[e2e] timeout esperando /api/health == 200')
}

async function stopServer(server: ChildProcess | undefined): Promise<void> {
  if (!server || server.exitCode !== null) return
  await new Promise<void>((resolve) => {
    const forceKill = setTimeout(() => {
      server.kill('SIGKILL')
    }, 5_000)
    server.once('exit', () => {
      clearTimeout(forceKill)
      resolve()
    })
    server.kill('SIGTERM')
  })
}

function removeTempDir(tempDir: string | undefined): void {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
