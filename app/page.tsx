"use client";

import { useEffect, useState } from "react";
import { Aluno } from "../types/aluno";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function AlunosPage() {
  const router = useRouter();

  const initialForm: Aluno = {
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

  };

  const [form, setForm] = useState<Aluno>(initialForm);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function verificarSessaoEBuscarEmpresa() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return null;
    }

    const { data: empresaData, error: empresaError } = await supabase
      .from("empresas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (empresaError || !empresaData) {
      alert("Empresa não encontrada para este usuário.");
      await supabase.auth.signOut();
      router.push("/login");
      return null;
    }

    setEmpresa(empresaData);

    setForm((prev) => ({
      ...prev,
      empresa_id: empresaData.id,
    }));

    return empresaData;
  }

  async function carregarAlunos(empresaId: string) {
    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar alunos:", error.message);
      return;
    }

    setAlunos(data || []);
  }

  useEffect(() => {
    async function iniciarPagina() {
      const empresaEncontrada = await verificarSessaoEBuscarEmpresa();

      if (empresaEncontrada) {
        await carregarAlunos(empresaEncontrada.id);
      }

      setLoading(false);
    }

    iniciarPagina();
  }, []);

function handleChange(
  e: React.ChangeEvent<
    HTMLInputElement |
    HTMLTextAreaElement |
    HTMLSelectElement
  >
) {
  const { name, value, type } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]:
      type === "number"
        ? Number(value)
        : value,
  }));
}
  function limparFormulario() {
    setForm({
      ...initialForm,
      empresa_id: empresa?.id || "",
    });
    setEditandoId(null);
  }

  function editarAluno(aluno: any) {
    setEditandoId(aluno.id);
    setForm({
      empresa_id: aluno.empresa_id || empresa?.id || "",
      nome: aluno.nome || "",
      dataNascimento: aluno.data_nascimento || "",
      responsavel: aluno.responsavel || "",
      whatsapp: aluno.whatsapp || "",
      email: aluno.email || "",
      mensalidade: Number(aluno.mensalidade || 0),
      vencimento: aluno.vencimento || "",
      observacoes: aluno.observacoes || "",

data_inicio: aluno.data_inicio || "",
data_fim: aluno.data_fim || "",
status_matricula:
  aluno.status_matricula || "ativo",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deletarAluno(id: string) {
    const { error } = await supabase.from("alunos").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir:", error.message);
      alert("Erro ao excluir aluno.");
      return;
    }

    if (empresa?.id) {
      await carregarAlunos(empresa.id);
    }
  }

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!empresa?.id) {
    alert("Empresa não identificada.");
    return;
  }

  const statusEmpresa = empresa.status || "ativo";

  if (statusEmpresa !== "ativo") {
    alert("Seu acesso está bloqueado. Regularize seu pagamento.");
    return;
  }

  const limites: any = {
    "30": 30,
    "60": 60,
    "100": 100,
    ilimitado: Infinity,
  };

  const planoAtual = empresa.plano || "30";
  const limitePlano = limites[planoAtual] || 30;

  if (!editandoId && alunos.length >= limitePlano) {
    alert(`Seu plano permite apenas ${limitePlano} alunos.`);
    return;
  }

  const payload = {
    empresa_id: empresa.id,
    nome: form.nome,
    data_nascimento: form.dataNascimento || null,
    responsavel: form.responsavel,
    whatsapp: form.whatsapp,
    email: form.email,
    mensalidade: form.mensalidade,
    vencimento: form.vencimento || null,
    observacoes: form.observacoes,

data_inicio: form.data_inicio || null,
data_fim: form.data_fim || null,
status_matricula:
  form.status_matricula || "ativo",
  };

  if (editandoId) {
    const { error } = await supabase
      .from("alunos")
      .update(payload)
      .eq("id", editandoId);

    if (error) {
      console.error("Erro ao atualizar aluno:", error.message);
      alert("Erro ao atualizar aluno.");
      return;
    }

    alert("Aluno atualizado com sucesso!");
  } else {
    const { error } = await supabase.from("alunos").insert([payload]);

    if (error) {
      console.error("Erro ao salvar aluno:", error.message);
      alert("Erro ao salvar aluno.");
      return;
    }

    alert("Aluno salvo com sucesso!");
  }

  limparFormulario();

  if (empresa?.id) {
    await carregarAlunos(empresa.id);
  }
}
  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <main className="p-10">Carregando...</main>;
  }

  return (
    <main className="p-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Alunos</h1>
          <p className="text-gray-600 mt-1">
            Empresa logada: <strong>{empresa?.nome_fantasia || "-"}</strong>
          </p>
        </div>

        <button
          onClick={sair}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Sair
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl"
      >
        <div className="flex flex-col">
  <label className="mb-1 font-medium">
    Início contrato
  </label>

  <input
    type="date"
    name="data_inicio"
    className="border p-2 rounded"
    onChange={handleChange}
    value={form.data_inicio || ""}
  />
</div>

<div className="flex flex-col">
  <label className="mb-1 font-medium">
    Fim contrato
  </label>

  <input
    type="date"
    name="data_fim"
    className="border p-2 rounded"
    onChange={handleChange}
    value={form.data_fim || ""}
  />
</div>

<div className="flex flex-col">
  <label className="mb-1 font-medium">
    Status matrícula
  </label>

  <select
    name="status_matricula"
    className="border p-2 rounded"
    onChange={handleChange}
    value={form.status_matricula || "ativo"}
  >
    <option value="ativo">
      Ativo
    </option>

    <option value="pausado">
      Pausado
    </option>

    <option value="cancelado">
      Cancelado
    </option>
  </select>
</div>
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Nome do aluno</label>
          <input
            name="nome"
            placeholder="Nome do aluno"
            className="border p-2 rounded"
            onChange={handleChange}
            value={form.nome}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Data de nascimento</label>
          <input
            type="date"
            name="dataNascimento"
            className="border p-2 rounded"
            onChange={handleChange}
            value={form.dataNascimento}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Responsável</label>
          <input
            name="responsavel"
            placeholder="Responsável"
            className="border p-2 rounded"
            onChange={handleChange}
            value={form.responsavel}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">WhatsApp</label>
          <input
            name="whatsapp"
            placeholder="WhatsApp"
            className="border p-2 rounded"
            onChange={handleChange}
            value={form.whatsapp}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Email</label>
          <input
            name="email"
            placeholder="Email"
            className="border p-2 rounded"
            onChange={handleChange}
            value={form.email}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Mensalidade</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="mensalidade"
              placeholder="0,00"
              className="border p-2 pl-10 rounded w-full"
              onChange={handleChange}
              value={form.mensalidade}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Data de vencimento</label>
          <input
            type="date"
            name="vencimento"
            className="border p-2 rounded"
            onChange={handleChange}
            value={form.vencimento}
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="mb-1 font-medium">Observações</label>
          <textarea
            name="observacoes"
            placeholder="Observações"
            className="border p-2 rounded min-h-[120px]"
            onChange={handleChange}
            value={form.observacoes}
          />
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button className="bg-green-600 text-white p-2 rounded">
            {editandoId ? "Atualizar aluno" : "Salvar aluno"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold mb-4">Alunos cadastrados</h2>

        {alunos.length === 0 ? (
          <p className="text-gray-600">Nenhum aluno cadastrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {alunos.map((aluno) => (
              <div key={aluno.id} className="border rounded p-4 shadow-sm">
                <p>
                  <strong>Nome:</strong> {aluno.nome}
                </p>
                <p>
                  <strong>Responsável:</strong> {aluno.responsavel}
                </p>
                <p>
                  <strong>WhatsApp:</strong> {aluno.whatsapp}
                </p>
                <p>
                  <strong>Email:</strong> {aluno.email || "-"}
                </p>
                <p>
                  <strong>Mensalidade:</strong> R$ {Number(aluno.mensalidade || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Nascimento:</strong> {aluno.data_nascimento || "-"}
                </p>
                <p>
                  <strong>Vencimento:</strong> {aluno.vencimento || "-"}
                </p>
                <p>
  <strong>Início contrato:</strong>{" "}
  {aluno.data_inicio || "-"}
</p>

<p>
  <strong>Fim contrato:</strong>{" "}
  {aluno.data_fim || "-"}
</p>

<p>
  <strong>Status matrícula:</strong>{" "}

  <span
    className={`px-2 py-1 rounded text-white text-sm ${
      aluno.status_matricula === "ativo"
        ? "bg-green-600"
        : aluno.status_matricula === "pausado"
        ? "bg-yellow-500"
        : "bg-red-600"
    }`}
  >
    {aluno.status_matricula || "ativo"}
  </span>
</p>
                <p>
                  <strong>Observações:</strong> {aluno.observacoes || "-"}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => editarAluno(aluno)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => deletarAluno(aluno.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}