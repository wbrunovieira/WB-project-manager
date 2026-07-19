import { describe, test, expect } from 'vitest';
import { issueMatchesQuery } from '@/lib/issue-search';

const issue = {
  identifier: '353',
  title: 'Harden node error handling',
  description: 'Risco real de 500 nos nós',
  assignee: { name: 'Bruno Vieira', email: 'bruno@wbdigitalsolutions.com' },
};

describe('issueMatchesQuery', () => {
  test('acha pelo identifier com prefixo # (o bug)', () => {
    expect(issueMatchesQuery(issue, '#353')).toBe(true);
  });

  test('acha pelo identifier sem #', () => {
    expect(issueMatchesQuery(issue, '353')).toBe(true);
  });

  test('# sozinho não vira match universal', () => {
    expect(issueMatchesQuery(issue, '#')).toBe(false);
  });

  test('remove só um # inicial (##353 não casa)', () => {
    expect(issueMatchesQuery(issue, '##353')).toBe(false);
  });

  test('não casa identifier de outra issue', () => {
    expect(issueMatchesQuery(issue, '#354')).toBe(false);
  });

  test('acha por título, case-insensitive', () => {
    expect(issueMatchesQuery(issue, 'HARDEN')).toBe(true);
  });

  test('acha por descrição', () => {
    expect(issueMatchesQuery(issue, '500')).toBe(true);
  });

  test('acha por nome do assignee', () => {
    expect(issueMatchesQuery(issue, 'bruno')).toBe(true);
  });

  test('acha por email do assignee', () => {
    expect(issueMatchesQuery(issue, 'wbdigital')).toBe(true);
  });

  test('query vazia/espaços não filtra (retorna true)', () => {
    expect(issueMatchesQuery(issue, '')).toBe(true);
    expect(issueMatchesQuery(issue, '   ')).toBe(true);
  });

  test('termo com espaços nas bordas é normalizado', () => {
    expect(issueMatchesQuery(issue, '  #353  ')).toBe(true);
  });

  test('não quebra com campos ausentes', () => {
    expect(issueMatchesQuery({ identifier: '1' }, 'nada')).toBe(false);
    expect(issueMatchesQuery({ identifier: '1' }, '1')).toBe(true);
  });
});
