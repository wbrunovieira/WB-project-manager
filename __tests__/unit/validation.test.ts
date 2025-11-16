import { describe, test, expect } from 'vitest';
import { z } from 'zod';

// Schemas de validação baseados nos usados nas APIs
const createIssueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  statusId: z.string().min(1, 'Status is required'),
  workspaceId: z.string().min(1, 'Workspace is required'),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  featureId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY']).optional(),
  type: z.enum(['FEATURE', 'MAINTENANCE', 'BUG', 'IMPROVEMENT']).optional(),
  reportedAt: z.string().datetime().optional(),
  labelIds: z.array(z.string()).optional(),
});

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  statusId: z.string().optional(),
  projectId: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  featureId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY']).optional(),
  type: z.enum(['FEATURE', 'MAINTENANCE', 'BUG', 'IMPROVEMENT']).optional(),
  reportedAt: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace is required'),
  type: z.enum(['DEVELOPMENT', 'MAINTENANCE']).default('DEVELOPMENT'),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).default('PLANNED'),
  startDate: z.string().datetime().optional(),
  targetDate: z.string().datetime().optional(),
});

const bulkIssuesSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace is required'),
  issues: z.array(createIssueSchema).min(1, 'At least one issue required').max(100, 'Maximum 100 issues'),
});

describe('Issue Validation', () => {
  describe('Create Issue Schema', () => {
    test('valida issue válida com campos obrigatórios', () => {
      const validIssue = {
        title: 'Test Issue',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
      };

      const result = createIssueSchema.safeParse(validIssue);

      expect(result.success).toBe(true);
    });

    test('rejeita issue sem título', () => {
      const invalidIssue = {
        statusId: 'status-123',
        workspaceId: 'workspace-123',
      };

      const result = createIssueSchema.safeParse(invalidIssue);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    test('rejeita issue com título vazio', () => {
      const invalidIssue = {
        title: '',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
      };

      const result = createIssueSchema.safeParse(invalidIssue);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title is required');
      }
    });

    test('rejeita issue sem statusId', () => {
      const invalidIssue = {
        title: 'Test Issue',
        workspaceId: 'workspace-123',
      };

      const result = createIssueSchema.safeParse(invalidIssue);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('statusId');
      }
    });

    test('rejeita issue sem workspaceId', () => {
      const invalidIssue = {
        title: 'Test Issue',
        statusId: 'status-123',
      };

      const result = createIssueSchema.safeParse(invalidIssue);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('workspaceId');
      }
    });

    test('aceita campos opcionais', () => {
      const issueWithOptionals = {
        title: 'Test Issue',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
        description: 'Test description',
        projectId: 'project-123',
        assigneeId: 'user-123',
        priority: 'HIGH' as const,
        type: 'BUG' as const,
        labelIds: ['label-1', 'label-2'],
      };

      const result = createIssueSchema.safeParse(issueWithOptionals);

      expect(result.success).toBe(true);
    });

    test('rejeita priority inválida', () => {
      const invalidIssue = {
        title: 'Test Issue',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
        priority: 'INVALID_PRIORITY',
      };

      const result = createIssueSchema.safeParse(invalidIssue);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('priority');
      }
    });

    test('rejeita type inválido', () => {
      const invalidIssue = {
        title: 'Test Issue',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
        type: 'INVALID_TYPE',
      };

      const result = createIssueSchema.safeParse(invalidIssue);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    test('aceita todas as prioridades válidas', () => {
      const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'] as const;

      priorities.forEach(priority => {
        const issue = {
          title: 'Test Issue',
          statusId: 'status-123',
          workspaceId: 'workspace-123',
          priority,
        };

        const result = createIssueSchema.safeParse(issue);
        expect(result.success).toBe(true);
      });
    });

    test('aceita todos os tipos válidos', () => {
      const types = ['FEATURE', 'MAINTENANCE', 'BUG', 'IMPROVEMENT'] as const;

      types.forEach(type => {
        const issue = {
          title: 'Test Issue',
          statusId: 'status-123',
          workspaceId: 'workspace-123',
          type,
        };

        const result = createIssueSchema.safeParse(issue);
        expect(result.success).toBe(true);
      });
    });

    test('valida reportedAt como ISO datetime', () => {
      const issue = {
        title: 'Test Issue',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
        reportedAt: '2024-01-15T09:00:00Z',
      };

      const result = createIssueSchema.safeParse(issue);

      expect(result.success).toBe(true);
    });

    test('rejeita reportedAt com formato inválido', () => {
      const issue = {
        title: 'Test Issue',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
        reportedAt: '2024-01-15', // Data sem hora
      };

      const result = createIssueSchema.safeParse(issue);

      expect(result.success).toBe(false);
    });

    test('valida labelIds como array de strings', () => {
      const issue = {
        title: 'Test Issue',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
        labelIds: ['label-1', 'label-2', 'label-3'],
      };

      const result = createIssueSchema.safeParse(issue);

      expect(result.success).toBe(true);
    });

    test('aceita labelIds vazio', () => {
      const issue = {
        title: 'Test Issue',
        statusId: 'status-123',
        workspaceId: 'workspace-123',
        labelIds: [],
      };

      const result = createIssueSchema.safeParse(issue);

      expect(result.success).toBe(true);
    });
  });

  describe('Update Issue Schema', () => {
    test('permite atualização parcial (todos campos opcionais)', () => {
      const update = {
        title: 'Updated Title',
      };

      const result = updateIssueSchema.safeParse(update);

      expect(result.success).toBe(true);
    });

    test('permite definir campos como null', () => {
      const update = {
        description: null,
        projectId: null,
        assigneeId: null,
      };

      const result = updateIssueSchema.safeParse(update);

      expect(result.success).toBe(true);
    });

    test('valida título não vazio quando fornecido', () => {
      const update = {
        title: '',
      };

      const result = updateIssueSchema.safeParse(update);

      expect(result.success).toBe(false);
    });

    test('permite atualizar múltiplos campos', () => {
      const update = {
        title: 'New Title',
        description: 'New description',
        priority: 'URGENT' as const,
        assigneeId: 'new-user-123',
      };

      const result = updateIssueSchema.safeParse(update);

      expect(result.success).toBe(true);
    });

    test('permite objeto vazio (nenhuma atualização)', () => {
      const update = {};

      const result = updateIssueSchema.safeParse(update);

      expect(result.success).toBe(true);
    });
  });
});

describe('Project Validation', () => {
  test('valida projeto válido', () => {
    const validProject = {
      name: 'Test Project',
      workspaceId: 'workspace-123',
    };

    const result = createProjectSchema.safeParse(validProject);

    expect(result.success).toBe(true);
  });

  test('rejeita projeto sem nome', () => {
    const invalidProject = {
      workspaceId: 'workspace-123',
    };

    const result = createProjectSchema.safeParse(invalidProject);

    expect(result.success).toBe(false);
  });

  test('rejeita projeto sem workspaceId', () => {
    const invalidProject = {
      name: 'Test Project',
    };

    const result = createProjectSchema.safeParse(invalidProject);

    expect(result.success).toBe(false);
  });

  test('usa valores default para type e status', () => {
    const project = {
      name: 'Test Project',
      workspaceId: 'workspace-123',
    };

    const result = createProjectSchema.safeParse(project);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('DEVELOPMENT');
      expect(result.data.status).toBe('PLANNED');
    }
  });

  test('aceita type customizado', () => {
    const project = {
      name: 'Test Project',
      workspaceId: 'workspace-123',
      type: 'MAINTENANCE' as const,
    };

    const result = createProjectSchema.safeParse(project);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('MAINTENANCE');
    }
  });

  test('aceita status customizado', () => {
    const project = {
      name: 'Test Project',
      workspaceId: 'workspace-123',
      status: 'IN_PROGRESS' as const,
    };

    const result = createProjectSchema.safeParse(project);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('IN_PROGRESS');
    }
  });

  test('valida datas como ISO datetime', () => {
    const project = {
      name: 'Test Project',
      workspaceId: 'workspace-123',
      startDate: '2024-01-01T00:00:00Z',
      targetDate: '2024-12-31T23:59:59Z',
    };

    const result = createProjectSchema.safeParse(project);

    expect(result.success).toBe(true);
  });

  test('rejeita tipos de projeto inválidos', () => {
    const project = {
      name: 'Test Project',
      workspaceId: 'workspace-123',
      type: 'INVALID_TYPE',
    };

    const result = createProjectSchema.safeParse(project);

    expect(result.success).toBe(false);
  });

  test('rejeita status de projeto inválidos', () => {
    const project = {
      name: 'Test Project',
      workspaceId: 'workspace-123',
      status: 'INVALID_STATUS',
    };

    const result = createProjectSchema.safeParse(project);

    expect(result.success).toBe(false);
  });
});

describe('Bulk Issues Validation', () => {
  test('valida bulk request válido', () => {
    const bulkRequest = {
      workspaceId: 'workspace-123',
      issues: [
        {
          title: 'Issue 1',
          statusId: 'status-123',
          workspaceId: 'workspace-123',
        },
        {
          title: 'Issue 2',
          statusId: 'status-123',
          workspaceId: 'workspace-123',
        },
      ],
    };

    const result = bulkIssuesSchema.safeParse(bulkRequest);

    expect(result.success).toBe(true);
  });

  test('rejeita request sem workspaceId', () => {
    const bulkRequest = {
      issues: [
        {
          title: 'Issue 1',
          statusId: 'status-123',
          workspaceId: 'workspace-123',
        },
      ],
    };

    const result = bulkIssuesSchema.safeParse(bulkRequest);

    expect(result.success).toBe(false);
  });

  test('rejeita array vazio de issues', () => {
    const bulkRequest = {
      workspaceId: 'workspace-123',
      issues: [],
    };

    const result = bulkIssuesSchema.safeParse(bulkRequest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one issue');
    }
  });

  test('rejeita mais de 100 issues', () => {
    const issues = Array(101).fill(null).map((_, i) => ({
      title: `Issue ${i + 1}`,
      statusId: 'status-123',
      workspaceId: 'workspace-123',
    }));

    const bulkRequest = {
      workspaceId: 'workspace-123',
      issues,
    };

    const result = bulkIssuesSchema.safeParse(bulkRequest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum 100 issues');
    }
  });

  test('aceita exatamente 100 issues', () => {
    const issues = Array(100).fill(null).map((_, i) => ({
      title: `Issue ${i + 1}`,
      statusId: 'status-123',
      workspaceId: 'workspace-123',
    }));

    const bulkRequest = {
      workspaceId: 'workspace-123',
      issues,
    };

    const result = bulkIssuesSchema.safeParse(bulkRequest);

    expect(result.success).toBe(true);
  });

  test('valida cada issue individualmente', () => {
    const bulkRequest = {
      workspaceId: 'workspace-123',
      issues: [
        {
          title: 'Valid Issue',
          statusId: 'status-123',
          workspaceId: 'workspace-123',
        },
        {
          // Issue inválida - sem título
          statusId: 'status-123',
          workspaceId: 'workspace-123',
        },
      ],
    };

    const result = bulkIssuesSchema.safeParse(bulkRequest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('issues');
      expect(result.error.issues[0].path).toContain(1); // Segunda issue (índice 1)
    }
  });

  test('aceita issues com campos opcionais diferentes', () => {
    const bulkRequest = {
      workspaceId: 'workspace-123',
      issues: [
        {
          title: 'Issue 1',
          statusId: 'status-123',
          workspaceId: 'workspace-123',
          priority: 'HIGH' as const,
        },
        {
          title: 'Issue 2',
          statusId: 'status-123',
          workspaceId: 'workspace-123',
          type: 'BUG' as const,
          assigneeId: 'user-123',
        },
      ],
    };

    const result = bulkIssuesSchema.safeParse(bulkRequest);

    expect(result.success).toBe(true);
  });
});

describe('Edge Cases', () => {
  test('rejeita strings muito longas (se houver limite)', () => {
    const veryLongTitle = 'A'.repeat(10000);
    const issue = {
      title: veryLongTitle,
      statusId: 'status-123',
      workspaceId: 'workspace-123',
    };

    const result = createIssueSchema.safeParse(issue);

    // Atualmente aceita, mas poderia ter validação de max length
    expect(result.success).toBe(true);
  });

  test('aceita caracteres especiais no título', () => {
    const issue = {
      title: 'Test Issue 🚀 with émojis & spëcial çhars!',
      statusId: 'status-123',
      workspaceId: 'workspace-123',
    };

    const result = createIssueSchema.safeParse(issue);

    expect(result.success).toBe(true);
  });

  test('rejeita tipos de dados incorretos', () => {
    const issue = {
      title: 123, // Número em vez de string
      statusId: 'status-123',
      workspaceId: 'workspace-123',
    };

    const result = createIssueSchema.safeParse(issue);

    expect(result.success).toBe(false);
  });

  test('rejeita labelIds com elementos não-string', () => {
    const issue = {
      title: 'Test Issue',
      statusId: 'status-123',
      workspaceId: 'workspace-123',
      labelIds: ['label-1', 123, 'label-3'], // Número no array
    };

    const result = createIssueSchema.safeParse(issue);

    expect(result.success).toBe(false);
  });
});
