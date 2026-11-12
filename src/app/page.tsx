import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * A raiz é só um roteador: entra quem está logado, vai para o login quem não está.
 *
 * Antes havia aqui uma landing — e ela era a ÚNICA rota do app que respondia 200
 * sem sessão (o middleware a excluía de propósito). Só não aparecia na internet
 * porque a Authelia estava na frente; medindo direto no app, `/` devolvia 200
 * enquanto todas as outras páginas já redirecionavam sozinhas. Esta é uma
 * ferramenta interna, então a landing não tinha para quem falar.
 */
export default async function RootPage() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/login");
}
