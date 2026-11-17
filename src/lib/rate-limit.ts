/**
 * Limitador de tentativas por janela deslizante, em memória.
 *
 * Existe porque quem segurava força bruta no login era a Authelia, na porta — e
 * o app está saindo dela (issues #2888/#2889). Sem isto, `/login` e
 * `/api/auth/register` ficam expostos a tentativa automatizada.
 *
 * Em memória de propósito: roda um container só, com um punhado de usuários.
 * Redis aqui seria peso morto. O custo dessa escolha é explícito — o estado é
 * POR PROCESSO: ao escalar para mais de uma instância, cada uma contaria
 * separado, e o limite efetivo viraria N × max. Se isso acontecer, trocar o
 * backing store (a interface não muda).
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Tentativas restantes na janela (0 quando bloqueado). */
  remaining: number;
  /** Quanto esperar até a janela liberar. 0 quando permitido. */
  retryAfterSeconds: number;
}

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number
  ) {}

  /**
   * Registra uma tentativa e diz se ela passa. Chamar UMA vez por tentativa:
   * o próprio check contabiliza.
   */
  check(key: string, now = Date.now()): RateLimitResult {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff);

    if (recent.length >= this.max) {
      // Bloqueado: a tentativa barrada NÃO entra na contagem, senão quem
      // insiste empurraria a liberação para frente indefinidamente.
      this.hits.set(key, recent);
      const oldest = recent[0];
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000)),
      };
    }

    recent.push(now);
    this.hits.set(key, recent);
    this.prune(cutoff);

    return {
      allowed: true,
      remaining: this.max - recent.length,
      retryAfterSeconds: 0,
    };
  }

  /** Zera a contagem de uma chave — usar após autenticação bem-sucedida. */
  reset(key: string): void {
    this.hits.delete(key);
  }

  /** Descarta chaves cujas tentativas já saíram da janela (evita crescer sem fim). */
  private prune(cutoff: number): void {
    for (const [key, times] of this.hits) {
      const kept = times.filter((t) => t > cutoff);
      if (kept.length === 0) this.hits.delete(key);
      else if (kept.length !== times.length) this.hits.set(key, kept);
    }
  }
}

/**
 * IP do cliente a partir dos cabeçalhos de proxy.
 *
 * Só é confiável porque o app NUNCA é exposto direto: o nginx é quem preenche
 * X-Forwarded-For, e a porta 3002 escuta apenas em 127.0.0.1. Num cenário sem
 * proxy à frente, este cabeçalho é forjável e não serviria como chave.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Tentativas de login: 5 por IP e por e-mail, em 15 minutos. */
export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000);

/** Cadastro: 3 por IP por hora — mais apertado, é operação rara. */
export const registerLimiter = new RateLimiter(3, 60 * 60 * 1000);
