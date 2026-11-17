import { describe, test, expect } from "vitest";
import { RateLimiter, clientIp } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  test("permite até o limite e bloqueia a seguinte", () => {
    const rl = new RateLimiter(3, 60_000);
    const t = 1_000_000;

    expect(rl.check("ip", t).allowed).toBe(true);
    expect(rl.check("ip", t).allowed).toBe(true);
    expect(rl.check("ip", t).allowed).toBe(true);
    expect(rl.check("ip", t).allowed).toBe(false);
  });

  test("conta o que resta na janela", () => {
    const rl = new RateLimiter(3, 60_000);
    const t = 1_000_000;

    expect(rl.check("ip", t).remaining).toBe(2);
    expect(rl.check("ip", t).remaining).toBe(1);
    expect(rl.check("ip", t).remaining).toBe(0);
  });

  test("libera quando a janela passa", () => {
    const rl = new RateLimiter(2, 60_000);
    const t = 1_000_000;

    rl.check("ip", t);
    rl.check("ip", t);
    expect(rl.check("ip", t).allowed).toBe(false);

    // 60s depois da PRIMEIRA tentativa, ela sai da janela
    expect(rl.check("ip", t + 60_001).allowed).toBe(true);
  });

  test("janela é deslizante, não um balde que zera de uma vez", () => {
    const rl = new RateLimiter(2, 60_000);
    const t = 1_000_000;

    rl.check("ip", t); // t
    rl.check("ip", t + 30_000); // t+30s
    expect(rl.check("ip", t + 31_000).allowed).toBe(false);

    // t+60_001 só expira a primeira; a segunda (t+30s) ainda conta
    expect(rl.check("ip", t + 60_001).allowed).toBe(true);
    expect(rl.check("ip", t + 60_002).allowed).toBe(false);
  });

  test("insistir enquanto bloqueado não empurra a liberação para frente", () => {
    const rl = new RateLimiter(2, 60_000);
    const t = 1_000_000;

    rl.check("ip", t);
    rl.check("ip", t);

    // Martelando durante o bloqueio...
    for (let i = 1; i <= 20; i++) rl.check("ip", t + i * 1000);

    // ...a liberação continua sendo 60s após a PRIMEIRA tentativa.
    expect(rl.check("ip", t + 60_001).allowed).toBe(true);
  });

  test("retryAfterSeconds diz quanto falta", () => {
    const rl = new RateLimiter(1, 60_000);
    const t = 1_000_000;

    rl.check("ip", t);
    const bloqueado = rl.check("ip", t + 10_000);

    expect(bloqueado.allowed).toBe(false);
    expect(bloqueado.retryAfterSeconds).toBe(50);
  });

  test("chaves diferentes não se afetam", () => {
    const rl = new RateLimiter(1, 60_000);
    const t = 1_000_000;

    expect(rl.check("ip:1.1.1.1", t).allowed).toBe(true);
    expect(rl.check("ip:1.1.1.1", t).allowed).toBe(false);
    expect(rl.check("ip:2.2.2.2", t).allowed).toBe(true);
  });

  test("reset zera a contagem (login bem-sucedido)", () => {
    const rl = new RateLimiter(2, 60_000);
    const t = 1_000_000;

    rl.check("user", t);
    rl.check("user", t);
    expect(rl.check("user", t).allowed).toBe(false);

    rl.reset("user");
    expect(rl.check("user", t).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  test("usa o primeiro IP do x-forwarded-for (o cliente, não os proxies)", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1, 172.16.0.1" });
    expect(clientIp(h)).toBe("203.0.113.5");
  });

  test("cai para x-real-ip quando não há forwarded", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  test("sem cabeçalho nenhum vira 'unknown' — nunca lança", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });

  test("x-forwarded-for vazio não vira string vazia como chave", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});
