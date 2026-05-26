"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");

  useEffect(() => {
    async function verificarUsuario() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setNome(user.email || "Usuário");
    }

    verificarUsuario();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#1f2430] text-white p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold">
              Selvor
            </h1>

            <p className="text-gray-300 mt-2">
              Bem-vindo, {nome}
            </p>
          </div>

          <button
            onClick={sair}
            className="bg-red-600 px-4 py-2 rounded"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button
            onClick={() => router.push("/alunos")}
            className="bg-[#2a3142] hover:bg-[#343d52] transition p-6 rounded-xl text-left"
          >
            <h2 className="text-2xl font-bold mb-2">
              Alunos
            </h2>

            <p className="text-gray-300">
              Gerencie alunos da escolinha
            </p>
          </button>

          <div className="bg-[#2a3142] p-6 rounded-xl opacity-60">
            <h2 className="text-2xl font-bold mb-2">
              Financeiro
            </h2>

            <p className="text-gray-300">
              Em desenvolvimento
            </p>
          </div>

          <div className="bg-[#2a3142] p-6 rounded-xl opacity-60">
            <h2 className="text-2xl font-bold mb-2">
              Relatórios
            </h2>

            <p className="text-gray-300">
              Em desenvolvimento
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}