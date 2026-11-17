import { LoginForm } from "./login-form";

/**
 * Server component só para ler a flag em tempo de execução.
 *
 * Não dá para usar NEXT_PUBLIC_*: essas variáveis são embutidas no build, e o
 * objetivo aqui é poder ligar/desligar o cadastro mexendo no ambiente e
 * reiniciando o container, sem rebuild.
 */
export default function LoginPage() {
  return <LoginForm allowRegistration={process.env.ALLOW_REGISTRATION === "true"} />;
}
