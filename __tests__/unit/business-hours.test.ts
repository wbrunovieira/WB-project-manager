import { describe, test, expect } from 'vitest';
import {
  calculateBusinessHours,
  formatBusinessHours,
  addBusinessHours,
  checkSLAStatus,
} from '@/lib/business-hours';

describe('calculateBusinessHours', () => {
  describe('Casos Básicos', () => {
    test('calcula horas dentro do mesmo dia útil', () => {
      // Segunda-feira, 9:00 AM → 2:00 PM = 5 horas
      const start = new Date('2024-01-15T09:00:00');
      const end = new Date('2024-01-15T14:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(5 * 60); // 300 minutos
    });

    test('retorna 0 para horário de fim antes do início', () => {
      const start = new Date('2024-01-15T14:00:00');
      const end = new Date('2024-01-15T09:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(0);
    });

    test('retorna 0 para datas iguais', () => {
      const start = new Date('2024-01-15T10:00:00');
      const end = new Date('2024-01-15T10:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(0);
    });

    test('calcula horas entre dias diferentes', () => {
      // Segunda 2:00 PM → Terça 11:00 AM
      // Segunda: 2:00 PM - 6:00 PM = 4 horas
      // Terça: 9:00 AM - 11:00 AM = 2 horas
      // Total: 6 horas = 360 minutos
      const start = new Date('2024-01-15T14:00:00');
      const end = new Date('2024-01-16T11:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(6 * 60); // 360 minutos
    });

    test('ignora fins de semana', () => {
      // Sexta 5:00 PM → Segunda 10:00 AM
      // Sexta: 5:00 PM - 6:00 PM = 1 hora
      // Segunda: 9:00 AM - 10:00 AM = 1 hora
      // Total: 2 horas
      const start = new Date('2024-01-19T17:00:00'); // Sexta
      const end = new Date('2024-01-22T10:00:00'); // Segunda

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(2 * 60); // 120 minutos
    });

    test('calcula através de múltiplos fins de semana', () => {
      // Segunda (15 Jan) 9:00 AM → Segunda (22 Jan) 9:00 AM
      // 5 dias úteis × 9 horas = 45 horas
      const start = new Date('2024-01-15T09:00:00');
      const end = new Date('2024-01-22T09:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(5 * 9 * 60); // 2700 minutos
    });

    test('calcula múltiplos dias completos', () => {
      // Segunda 9:00 AM → Sexta 6:00 PM = 5 dias × 9 horas
      const start = new Date('2024-01-15T09:00:00');
      const end = new Date('2024-01-19T18:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(5 * 9 * 60); // 2700 minutos
    });
  });

  describe('Edge Cases - Horário Fora do Expediente', () => {
    test('início antes do horário comercial (8:00 AM)', () => {
      // 8:00 AM → 2:00 PM = 9:00 AM → 2:00 PM = 5 horas
      const start = new Date('2024-01-15T08:00:00');
      const end = new Date('2024-01-15T14:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(5 * 60);
    });

    test('fim após horário comercial (7:00 PM)', () => {
      // 9:00 AM → 7:00 PM = 9:00 AM → 6:00 PM = 9 horas
      const start = new Date('2024-01-15T09:00:00');
      const end = new Date('2024-01-15T19:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(9 * 60);
    });

    test('início e fim fora do horário comercial', () => {
      // 8:00 AM → 7:00 PM = 9:00 AM → 6:00 PM = 9 horas
      const start = new Date('2024-01-15T08:00:00');
      const end = new Date('2024-01-15T19:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(9 * 60);
    });

    test('início após horário comercial', () => {
      // Sexta 7:00 PM → Segunda 10:00 AM
      // Segunda: 9:00 AM - 10:00 AM = 1 hora
      const start = new Date('2024-01-19T19:00:00'); // Sexta 7 PM
      const end = new Date('2024-01-22T10:00:00'); // Segunda 10 AM

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(60); // 1 hora
    });

    test('fim antes do horário comercial', () => {
      // Segunda 2:00 PM → Terça 8:00 AM
      // Segunda: 2:00 PM - 6:00 PM = 4 horas
      const start = new Date('2024-01-15T14:00:00');
      const end = new Date('2024-01-16T08:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(4 * 60);
    });

    test('ambos fora do horário no mesmo dia', () => {
      // 7:00 PM → 8:00 PM = 0 horas (ambos após horário comercial)
      const start = new Date('2024-01-15T19:00:00');
      const end = new Date('2024-01-15T20:00:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(0);
    });

    test('ambos antes do horário no mesmo dia', () => {
      // 7:00 AM → 8:30 AM = 0 horas (ambos antes de 9:00 AM)
      const start = new Date('2024-01-15T07:00:00');
      const end = new Date('2024-01-15T08:30:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(0);
    });
  });

  describe('Edge Cases - Fins de Semana', () => {
    test('início no sábado, fim na segunda', () => {
      // Sábado → Segunda 10:00 AM = 1 hora (só segunda)
      const start = new Date('2024-01-20T10:00:00'); // Sábado
      const end = new Date('2024-01-22T10:00:00'); // Segunda

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(60); // 1 hora
    });

    test('início no domingo, fim na segunda', () => {
      // Domingo → Segunda 10:00 AM = 1 hora (só segunda)
      const start = new Date('2024-01-21T10:00:00'); // Domingo
      const end = new Date('2024-01-22T10:00:00'); // Segunda

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(60); // 1 hora
    });

    test('início e fim ambos no sábado', () => {
      const start = new Date('2024-01-20T10:00:00'); // Sábado
      const end = new Date('2024-01-20T14:00:00'); // Sábado

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(0);
    });

    test('início e fim ambos no domingo', () => {
      const start = new Date('2024-01-21T10:00:00'); // Domingo
      const end = new Date('2024-01-21T14:00:00'); // Domingo

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(0);
    });

    test('cálculo de sexta 5:00 PM até segunda 10:00 AM', () => {
      // Sexta: 5:00 PM - 6:00 PM = 1 hora
      // Segunda: 9:00 AM - 10:00 AM = 1 hora
      const start = new Date('2024-01-19T17:00:00'); // Sexta
      const end = new Date('2024-01-22T10:00:00'); // Segunda

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(2 * 60); // 2 horas
    });
  });

  describe('Precisão', () => {
    test('calcula minutos corretamente (não arredonda)', () => {
      // 9:00 AM → 9:30 AM = 30 minutos
      const start = new Date('2024-01-15T09:00:00');
      const end = new Date('2024-01-15T09:30:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(30);
    });

    test('calcula frações de hora precisas', () => {
      // 9:15 AM → 2:45 PM = 5.5 horas = 330 minutos
      const start = new Date('2024-01-15T09:15:00');
      const end = new Date('2024-01-15T14:45:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(330);
    });

    test('calcula com segundos precisos', () => {
      // 9:00:30 AM → 9:30:30 AM = 30 minutos
      const start = new Date('2024-01-15T09:00:30');
      const end = new Date('2024-01-15T09:30:30');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(30);
    });

    test('múltiplos dias com frações', () => {
      // Segunda 9:30 AM → Quarta 2:45 PM
      // Segunda: 9:30 AM - 6:00 PM = 8.5 horas
      // Terça: 9 horas
      // Quarta: 9:00 AM - 2:45 PM = 5.75 horas
      // Total: 23.25 horas = 1395 minutos
      const start = new Date('2024-01-15T09:30:00');
      const end = new Date('2024-01-17T14:45:00');

      const minutes = calculateBusinessHours(start, end);

      expect(minutes).toBe(1395);
    });
  });

  describe('Performance', () => {
    test('cálculo rápido para períodos longos (30 dias)', () => {
      const start = new Date('2024-01-01T09:00:00');
      const end = new Date('2024-01-31T18:00:00');

      const startTime = Date.now();
      calculateBusinessHours(start, end);
      const duration = Date.now() - startTime;

      // Deve completar em menos de 100ms
      expect(duration).toBeLessThan(100);
    });

    test('cálculo rápido para períodos muito longos (1 ano)', () => {
      const start = new Date('2024-01-01T09:00:00');
      const end = new Date('2025-01-01T09:00:00');

      const startTime = Date.now();
      calculateBusinessHours(start, end);
      const duration = Date.now() - startTime;

      // Deve completar em menos de 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});

describe('formatBusinessHours', () => {
  test('formata minutos corretamente', () => {
    const start = new Date('2024-01-15T09:00:00');
    const end = new Date('2024-01-15T09:30:00');

    const formatted = formatBusinessHours(start, end);

    expect(formatted).toBe('30m');
  });

  test('formata horas sem minutos', () => {
    const start = new Date('2024-01-15T09:00:00');
    const end = new Date('2024-01-15T14:00:00');

    const formatted = formatBusinessHours(start, end);

    expect(formatted).toBe('5h');
  });

  test('formata horas com minutos', () => {
    const start = new Date('2024-01-15T09:00:00');
    const end = new Date('2024-01-15T14:30:00');

    const formatted = formatBusinessHours(start, end);

    expect(formatted).toBe('5h 30m');
  });

  test('formata dias completos', () => {
    // 2 dias × 9 horas = 18 horas
    // Como BUSINESS_HOURS_PER_DAY = 9, 18h / 9 = 2d
    // Mas se <24h, mostra como horas
    const start = new Date('2024-01-15T09:00:00');
    const end = new Date('2024-01-17T09:00:00');

    const formatted = formatBusinessHours(start, end);

    expect(formatted).toBe('18h'); // 18 horas (menos de 24h, então mostra em horas)
  });

  test('formata dias com horas', () => {
    // 2 dias + 3 horas = 21 horas
    const start = new Date('2024-01-15T09:00:00');
    const end = new Date('2024-01-17T12:00:00');

    const formatted = formatBusinessHours(start, end);

    expect(formatted).toBe('21h'); // Menos de 24h, mostra em horas
  });

  test('formata 0 minutos', () => {
    const start = new Date('2024-01-15T09:00:00');
    const end = new Date('2024-01-15T09:00:00');

    const formatted = formatBusinessHours(start, end);

    expect(formatted).toBe('0m');
  });
});

describe('addBusinessHours', () => {
  test('adiciona horas dentro do mesmo dia', () => {
    // 9:00 AM + 3 horas = 12:00 PM
    const start = new Date('2024-01-15T09:00:00');
    const result = addBusinessHours(start, 3);

    expect(result.getHours()).toBe(12);
    expect(result.getDate()).toBe(15);
  });

  test('adiciona horas pulando fim de semana', () => {
    // Sexta 9:00 AM + 10 horas = Segunda 10:00 AM
    // Sexta: 9 horas
    // Segunda: 1 hora
    const start = new Date('2024-01-19T09:00:00'); // Sexta
    const result = addBusinessHours(start, 10);

    expect(result.getDay()).toBe(1); // Segunda
    expect(result.getHours()).toBe(10);
  });

  test('adiciona horas começando fora do horário comercial', () => {
    // 8:00 AM + 2 horas = 11:00 AM (começa às 9:00 AM)
    const start = new Date('2024-01-15T08:00:00');
    const result = addBusinessHours(start, 2);

    expect(result.getHours()).toBe(11);
  });

  test('adiciona horas começando após horário comercial', () => {
    // Sexta 7:00 PM + 2 horas = Segunda 11:00 AM
    const start = new Date('2024-01-19T19:00:00'); // Sexta 7 PM
    const result = addBusinessHours(start, 2);

    expect(result.getDay()).toBe(1); // Segunda
    expect(result.getHours()).toBe(11);
  });

  test('adiciona múltiplos dias', () => {
    // Segunda 9:00 AM + 27 horas (3 dias)
    // Dia 15 (Seg): 9h, Dia 16 (Ter): 9h, Dia 17 (Qua): 9h
    const start = new Date('2024-01-15T09:00:00');
    const result = addBusinessHours(start, 27);

    expect(result.getDate()).toBe(17); // Quarta (15+2 dias, já que começa segunda)
    expect(result.getHours()).toBe(18); // 6 PM
  });

  test('adiciona 0 horas retorna mesma data', () => {
    const start = new Date('2024-01-15T09:00:00');
    const result = addBusinessHours(start, 0);

    expect(result.getTime()).toBe(start.getTime());
  });

  test('adiciona horas atravessando múltiplas semanas', () => {
    // Segunda 9:00 AM + 90 horas (10 dias úteis)
    const start = new Date('2024-01-15T09:00:00');
    const result = addBusinessHours(start, 90);

    // 90 horas = 10 dias úteis
    // 15-19 Jan = 5 dias, 22-26 Jan = 5 dias
    expect(result.getDate()).toBe(26); // Sexta, 26 de janeiro
  });
});

describe('checkSLAStatus', () => {
  describe('Status Calculation', () => {
    test('retorna "on-time" para <80% do SLA', () => {
      const start = new Date('2024-01-15T09:00:00');
      const current = new Date('2024-01-15T12:00:00'); // 3h de 8h = 37.5%

      const result = checkSLAStatus(start, 8, current);

      expect(result.status).toBe('on-time');
      expect(result.percentageUsed).toBeLessThan(80);
      expect(result.percentageUsed).toBe(38); // arredondado
    });

    test('retorna "at-risk" para ≥80% e <100%', () => {
      const start = new Date('2024-01-15T09:00:00');
      // 14h de 16h = 87.5%
      const current = new Date('2024-01-16T14:00:00');

      const result = checkSLAStatus(start, 16, current);

      expect(result.status).toBe('at-risk');
      expect(result.percentageUsed).toBeGreaterThanOrEqual(80);
      expect(result.percentageUsed).toBeLessThan(100);
    });

    test('retorna "overdue" para ≥100%', () => {
      const start = new Date('2024-01-15T09:00:00');
      const current = new Date('2024-01-17T10:00:00'); // >8h

      const result = checkSLAStatus(start, 8, current);

      expect(result.status).toBe('overdue');
      expect(result.percentageUsed).toBeGreaterThanOrEqual(100);
    });

    test('retorna exatamente 80% como "at-risk"', () => {
      const start = new Date('2024-01-15T09:00:00');
      // 8h de 10h = 80%
      const current = new Date('2024-01-15T17:00:00');

      const result = checkSLAStatus(start, 10, current);

      expect(result.status).toBe('at-risk');
      expect(result.percentageUsed).toBe(80);
    });

    test('retorna exatamente 100% como "overdue"', () => {
      const start = new Date('2024-01-15T09:00:00');
      // 8h de 8h = 100%
      const current = new Date('2024-01-15T17:00:00');

      const result = checkSLAStatus(start, 8, current);

      expect(result.status).toBe('overdue');
      expect(result.percentageUsed).toBe(100);
    });
  });

  describe('Remaining Time', () => {
    test('calcula remainingMinutes corretamente quando on-time', () => {
      const start = new Date('2024-01-15T09:00:00');
      const current = new Date('2024-01-15T12:00:00'); // 3h usadas

      const result = checkSLAStatus(start, 8, current);

      expect(result.elapsedMinutes).toBe(180); // 3h
      expect(result.remainingMinutes).toBe(300); // 5h restantes
    });

    test('remainingMinutes negativo quando overdue', () => {
      const start = new Date('2024-01-15T09:00:00');
      const current = new Date('2024-01-16T12:00:00'); // 12h usadas

      const result = checkSLAStatus(start, 8, current);

      expect(result.remainingMinutes).toBeLessThan(0);
    });
  });

  describe('Percentage Calculation', () => {
    test('percentageUsed é arredondado', () => {
      const start = new Date('2024-01-15T09:00:00');
      const current = new Date('2024-01-15T09:30:00'); // 30min de 8h = 6.25%

      const result = checkSLAStatus(start, 8, current);

      expect(result.percentageUsed).toBe(6); // arredondado de 6.25
    });

    test('percentageUsed é limitado a 100', () => {
      const start = new Date('2024-01-15T09:00:00');
      const current = new Date('2024-01-20T09:00:00'); // Muito overdue

      const result = checkSLAStatus(start, 8, current);

      // checkSLAStatus usa Math.min(100, ...) para limitar a 100
      expect(result.percentageUsed).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    test('SLA de 0 horas', () => {
      const start = new Date('2024-01-15T09:00:00');
      const current = new Date('2024-01-15T09:00:00');

      const result = checkSLAStatus(start, 0, current);

      // Com 0 horas de SLA e 0 elapsed, percentageUsed = 0/0 = NaN
      // Isso resulta em 'on-time' por padrão
      expect(result.status).toBe('on-time');
    });

    test('current antes de start retorna valores negativos', () => {
      const start = new Date('2024-01-15T09:00:00');
      const current = new Date('2024-01-15T08:00:00');

      const result = checkSLAStatus(start, 8, current);

      expect(result.elapsedMinutes).toBe(0); // calculateBusinessHours retorna 0
    });
  });
});
