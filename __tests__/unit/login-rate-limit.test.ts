import { describe, test, expect, beforeEach, vi } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

/**
 * O contrato do limite de login, isolado da plumbing do NextAuth.
 *
 * O caso central é a regressão da #3002: uma primeira versão bloqueava por
 * E-MAIL antes de verificar a senha, então quem soubesse o e-mail do dono
 * trancava o único usuário para fora, de qualquer IP, errando 5 senhas a cada
 * 15 min. Estes testes fixam o que ficou no lugar: o limite é por IP, e senha
 * correta nunca é recusada por contador.
 */

const MAX = 5;
const JANELA = 15 * 60 * 1000;

/** Reproduz a ordem de decisões do authorize() em src/lib/auth.ts. */
function tentarLogin(
  limiter: RateLimiter,
  { ip, senhaCorreta, now }: { ip: string; senhaCorreta: boolean; now: number }
): "ok" | "senha-invalida" | "bloqueado" {
  if (!limiter.check(`login:ip:${ip}`, now).allowed) return "bloqueado";
  if (!senhaCorreta) return "senha-invalida";
  limiter.reset(`login:ip:${ip}`);
  return "ok";
}

describe("limite de tentativas de login", () => {
  let limiter: RateLimiter;
  const t = 1_000_000;

  beforeEach(() => {
    limiter = new RateLimiter(MAX, JANELA);
  });

  test("atacante de um IP é contido após o limite", () => {
    for (let i = 0; i < MAX; i++) {
      expect(tentarLogin(limiter, { ip: "1.2.3.4", senhaCorreta: false, now: t })).toBe(
        "senha-invalida"
      );
    }

    expect(tentarLogin(limiter, { ip: "1.2.3.4", senhaCorreta: false, now: t })).toBe(
      "bloqueado"
    );
  });

  // A regressão da #3002.
  test("senha correta entra mesmo com o e-mail sob ataque de OUTROS IPs", () => {
    // 50 IPs diferentes martelando a conta do dono
    for (let i = 0; i < 50; i++) {
      tentarLogin(limiter, { ip: `10.0.0.${i}`, senhaCorreta: false, now: t });
    }

    // O dono, do IP dele, entra normalmente
    expect(tentarLogin(limiter, { ip: "200.1.1.1", senhaCorreta: true, now: t })).toBe("ok");
  });

  test("ataque de um IP não bloqueia o dono em outro IP", () => {
    for (let i = 0; i < MAX + 10; i++) {
      tentarLogin(limiter, { ip: "1.2.3.4", senhaCorreta: false, now: t });
    }

    expect(tentarLogin(limiter, { ip: "200.1.1.1", senhaCorreta: true, now: t })).toBe("ok");
  });

  test("o dono errando a senha algumas vezes ainda consegue entrar", () => {
    for (let i = 0; i < MAX - 1; i++) {
      tentarLogin(limiter, { ip: "200.1.1.1", senhaCorreta: false, now: t });
    }

    expect(tentarLogin(limiter, { ip: "200.1.1.1", senhaCorreta: true, now: t })).toBe("ok");
  });

  test("login bem-sucedido zera o contador do IP", () => {
    for (let i = 0; i < MAX - 1; i++) {
      tentarLogin(limiter, { ip: "200.1.1.1", senhaCorreta: false, now: t });
    }
    tentarLogin(limiter, { ip: "200.1.1.1", senhaCorreta: true, now: t });

    // Com o contador zerado, há MAX tentativas novas disponíveis
    for (let i = 0; i < MAX; i++) {
      expect(tentarLogin(limiter, { ip: "200.1.1.1", senhaCorreta: false, now: t })).toBe(
        "senha-invalida"
      );
    }
  });

  test("IP bloqueado volta a tentar depois da janela", () => {
    for (let i = 0; i < MAX; i++) {
      tentarLogin(limiter, { ip: "1.2.3.4", senhaCorreta: false, now: t });
    }
    expect(tentarLogin(limiter, { ip: "1.2.3.4", senhaCorreta: false, now: t })).toBe(
      "bloqueado"
    );

    expect(
      tentarLogin(limiter, { ip: "1.2.3.4", senhaCorreta: true, now: t + JANELA + 1 })
    ).toBe("ok");
  });

  test("o bloqueio por IP vem antes da senha — não gasta bcrypt à toa", () => {
    const verificarSenha = vi.fn(() => true);

    for (let i = 0; i < MAX; i++) {
      if (limiter.check("login:ip:1.2.3.4", t).allowed) verificarSenha();
    }
    verificarSenha.mockClear();

    // Já bloqueado: a senha nem chega a ser verificada
    if (limiter.check("login:ip:1.2.3.4", t).allowed) verificarSenha();
    expect(verificarSenha).not.toHaveBeenCalled();
  });
});
