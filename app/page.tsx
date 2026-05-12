"use client";

import { useState } from "react";
import { Aluno } from "@/types/aluno";

export default function AlunosPage() {
const [form, setForm] = useState<Aluno>({
  empresa_id: "",
  nome: "",
  dataNascimento: "",
  responsavel: "",
  whatsapp: "",
  email: "",
  mensalidade: 0,
  vencimento: "",
  observacoes: "",

  data_inicio: "",
  data_fim: "",
  status_matricula: "ativo",
});
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "number"
          ? Number(e.target.value)
          : e.target.value,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Dados do aluno:", form);
  }

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">Cadastro de Alunos</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl"
      >
        <input
          name="nome"
          placeholder="Nome do aluno"
          className="border p-2 rounded"
          onChange={handleChange}
        />

        <input
          type="date"
          name="dataNascimento"
          className="border p-2 rounded"
          onChange={handleChange}
        />

        <input
          name="responsavel"
          placeholder="Responsável"
          className="border p-2 rounded"
          onChange={handleChange}
        />

        <input
          name="whatsapp"
          placeholder="WhatsApp"
          className="border p-2 rounded"
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email"
          className="border p-2 rounded"
          onChange={handleChange}
        />

        <input
          type="number"
          name="mensalidade"
          placeholder="Mensalidade"
          className="border p-2 rounded"
          onChange={handleChange}
        />

        <input
          type="number"
          name="vencimento"
          placeholder="Vencimento"
          className="border p-2 rounded"
          onChange={handleChange}
        />

        <textarea
          name="observacoes"
          placeholder="Observações"
          className="border p-2 rounded col-span-2"
          onChange={handleChange}
        />

        <button className="bg-green-600 text-white p-2 rounded col-span-2">
          Salvar aluno
        </button>
      </form>
    </main>
  );
}