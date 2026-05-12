"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function EmpresasPage() {
  const [form, setForm] = useState({
    nome_fantasia: "",
    razao_social: "",
    nome_responsavel: "",
    whatsapp: "",
    email: "",
  });

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function carregarEmpresas() {
    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setEmpresas(data || []);
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function limparFormulario() {
    setForm({
      nome_fantasia: "",
      razao_social: "",
      nome_responsavel: "",
      whatsapp: "",
      email: "",
    });
    setEditandoId(null);
  }

  function adicionar14Dias() {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 14);
    return hoje.toISOString().split("T")[0];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editandoId) {
      const { error } = await supabase
        .from("empresas")
        .update(form)
        .eq("id", editandoId);

      if (error) {
        alert("Erro ao atualizar");
        return;
      }

      alert("Empresa atualizada!");
    } else {
      const payload = {
        ...form,
        plano: "trial",
        trial_ate: adicionar14Dias(),
        ativo: true,
      };

      const { error } = await supabase.from("empresas").insert([payload]);

      if (error) {
        alert("Erro ao salvar");
        return;
      }

      alert("Empresa cadastrada com 14 dias grátis!");
    }

    limparFormulario();
    carregarEmpresas();
  }

  async function deletarEmpresa(id: string) {
    const { error } = await supabase
      .from("empresas")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao excluir");
      return;
    }

    carregarEmpresas();
  }

  function editarEmpresa(emp: any) {
    setEditandoId(emp.id);
    setForm({
      nome_fantasia: emp.nome_fantasia || "",
      razao_social: emp.razao_social || "",
      nome_responsavel: emp.nome_responsavel || "",
      whatsapp: emp.whatsapp || "",
      email: emp.email || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">Cadastro de Empresas</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 max-w-xl">
        <input
          name="nome_fantasia"
          placeholder="Nome fantasia"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          value={form.nome_fantasia}
        />

        <input
          name="razao_social"
          placeholder="Razão social"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          value={form.razao_social}
        />

        <input
          name="nome_responsavel"
          placeholder="Responsável"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          value={form.nome_responsavel}
        />

        <input
          name="whatsapp"
          placeholder="WhatsApp"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          value={form.whatsapp}
        />

        <input
          name="email"
          placeholder="Email"
          className="border p-2 w-full rounded"
          onChange={handleChange}
          value={form.email}
        />

        <button className="bg-green-600 text-white p-2 w-full rounded">
          {editandoId ? "Atualizar empresa" : "Salvar empresa"}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Empresas cadastradas</h2>

        {empresas.map((emp) => (
          <div key={emp.id} className="border p-4 mb-3 rounded">
            <p>
              <strong>{emp.nome_fantasia}</strong>
            </p>
            <p>Responsável: {emp.nome_responsavel}</p>
            <p>Plano: {emp.plano || "-"}</p>
            <p>Trial até: {formatarData(emp.trial_ate)}</p>
            <p>Status: {emp.ativo ? "Ativa" : "Inativa"}</p>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => editarEmpresa(emp)}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Editar
              </button>

              <button
                onClick={() => deletarEmpresa(emp.id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}