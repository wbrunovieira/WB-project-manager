import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function getProjectInfo() {
  try {
    // Buscar projeto
    const project = await prisma.project.findUnique({
      where: { id: 'cmgfjhyh50005waqglsynsz1d' },
      include: {
        workspace: true,
        milestones: true
      }
    });

    if (!project) {
      console.log('Projeto não encontrado');
      return;
    }

    // Buscar milestone Sprint 1
    const milestone = project.milestones.find(m => m.name === 'Sprint 1');

    // Buscar statuses do workspace
    const statuses = await prisma.status.findMany({
      where: { workspaceId: project.workspaceId },
      orderBy: { position: 'asc' }
    });

    console.log('=== INFORMAÇÕES COMPLETAS ===\n');
    console.log('📁 Workspace:', project.workspace.name);
    console.log('   ID:', project.workspace.id);
    console.log('\n📦 Projeto:', project.name);
    console.log('   ID:', project.id);
    console.log('\n🎯 Milestone "Sprint 1"');
    console.log('   ID:', milestone?.id || 'NÃO ENCONTRADO');
    console.log('\n📋 Status Disponíveis:');
    statuses.forEach(s => {
      console.log(`   ${s.name.padEnd(15)} → ${s.id}`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getProjectInfo();
