"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PlanosPage() {
  const router = useRouter();

  async function selecionarPlano(plano: string, valor: number) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Usuário não encontrado");
        return;
      }

      const { data: empresa } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // 🔥 GARANTE QUE NUNCA VAI NULL
      const nome = empresa?.nome_fantasia || "Cliente Teste";
      const email = empresa?.email || "teste@email.com";

      const response = await fetch("/api/asaas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          valor,
        }),
      });

      const data = await response.json();

      console.log("RESPOSTA API:", data);

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert("Erro ao gerar pagamento");
      }

    } catch (error) {
      console.error("ERRO FRONT:", error);
      alert("Erro ao processar pagamento");
    }
  }

  return (
    <main className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-6">
        Escolha seu plano
      </h1>

      <p className="mb-10 text-gray-600">
        Continue usando o sistema escolhendo um plano abaixo
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">

        <div className="border p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Até 30 alunos</h2>
          <p className="text-2xl font-bold mb-4">R$ 39,90</p>
          <button
            onClick={() => selecionarPlano("30", 39.9)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Escolher
          </button>
        </div>

        <div className="border p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">31 a 60 alunos</h2>
          <p className="text-2xl font-bold mb-4">R$ 59,90</p>
          <button
            onClick={() => selecionarPlano("60", 59.9)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Escolher
          </button>
        </div>

        <div className="border p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">61 a 100 alunos</h2>
          <p className="text-2xl font-bold mb-4">R$ 79,90</p>
          <button
            onClick={() => selecionarPlano("100", 79.9)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Escolher
          </button>
        </div>

        <div className="border p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">100+ alunos</h2>
          <p className="text-2xl font-bold mb-4">R$ 99,90</p>
          <button
            onClick={() => selecionarPlano("ilimitado", 99.9)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Escolher
          </button>
        </div>

      </div>
    </main>
  );
}