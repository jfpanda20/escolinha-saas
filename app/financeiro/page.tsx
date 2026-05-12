"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function FinanceiroPage() {
  const router = useRouter();

  const [empresa, setEmpresa] = useState<any>(null);
  const [mensalidades, setMensalidades] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [buscaAluno, setBuscaAluno] = useState("");

  async function buscarEmpresaDoUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return null;
    }

    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      alert("Empresa não encontrada.");
      router.push("/login");
      return null;
    }

    setEmpresa(data);
    return data;
  }

  async function carregarAlunos(empresaId: string) {
    const { data } = await supabase
      .from("alunos")
      .select("*")
      .eq("empresa_id", empresaId);

    setAlunos(data || []);
  }

  async function carregarMensalidades(empresaId: string) {
    const { data } = await supabase
      .from("mensalidades")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("vencimento", { ascending: true });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const atualizadas = (data || []).map((item) => {
      if (item.data_pagamento) return { ...item, status: "pago" };

      const venc = item.vencimento ? new Date(item.vencimento) : null;
      if (venc) venc.setHours(0, 0, 0, 0);

      if (venc && venc < hoje) return { ...item, status: "atrasado" };

      return { ...item, status: "pendente" };
    });

    setMensalidades(atualizadas);
  }

  useEffect(() => {
    async function init() {
      const emp = await buscarEmpresaDoUsuario();

      if (emp) {
        await carregarAlunos(emp.id);
        await carregarMensalidades(emp.id);
      }

      setLoading(false);
    }

    init();
  }, []);

  async function criarMensalidade() {
    if (!alunoSelecionado || !valor || !vencimento) {
      alert("Preencha todos os campos");
      return;
    }

    const { error } = await supabase.from("mensalidades").insert([
      {
        empresa_id: empresa.id,
        aluno_id: alunoSelecionado,
        descricao,
        valor,
        vencimento,
        status: "pendente",
      },
    ]);

    if (error) {
      alert("Erro ao criar mensalidade");
      return;
    }

    alert("Mensalidade criada!");

    setAlunoSelecionado("");
    setDescricao("");
    setValor(0);
    setVencimento("");

    await carregarMensalidades(empresa.id);
  }
  
  async function gerarMensalidadesAutomaticas() {
  if (!empresa?.id) return;

  const hoje = new Date();

  const referencia =
    `${hoje.getFullYear()}-${String(
      hoje.getMonth() + 1
    ).padStart(2, "0")}`;

  const alunosValidos = alunos.filter((a) => {
    if (a.status_matricula !== "ativo")
      return false;

    if (!a.data_inicio || !a.data_fim)
      return false;

    const inicio = new Date(a.data_inicio);
    const fim = new Date(a.data_fim);

    return hoje >= inicio && hoje <= fim;
  });

  let criadas = 0;

  for (const aluno of alunosValidos) {
    const { data: existente } =
      await supabase
        .from("mensalidades")
        .select("id")
        .eq("aluno_id", aluno.id)
        .eq("referencia", referencia)
        .maybeSingle();

    if (existente) continue;

    const dia =
      aluno.vencimento
        ?.split("-")[2] || "10";

    const vencimento =
      `${referencia}-${dia}`;

    await supabase
      .from("mensalidades")
      .insert([
        {
          empresa_id: empresa.id,
          aluno_id: aluno.id,
          descricao:
            `Mensalidade ${referencia}`,
          valor:
            aluno.mensalidade || 0,
          vencimento,
          referencia,
          status: "pendente",
        },
      ]);

    criadas++;
  }

  alert(
    `${criadas} mensalidades geradas!`
  );

  await carregarMensalidades(
    empresa.id
  );
}

  async function marcarComoPago(id: string) {
    const hoje = new Date().toISOString().split("T")[0];

    await supabase
      .from("mensalidades")
      .update({
        data_pagamento: hoje,
        status: "pago",
      })
      .eq("id", id);

    await carregarMensalidades(empresa.id);
  }

  function nomeAluno(id: string) {
    return alunos.find((a) => a.id === id)?.nome || "-";
  }

function moeda(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function diasParaVencimento(data: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const venc = new Date(data);
  venc.setHours(0, 0, 0, 0);

  const diff =
    venc.getTime() - hoje.getTime();

  return Math.ceil(
    diff / (1000 * 60 * 60 * 24)
  );
}

const totalRecebido = mensalidades
  .filter((m) => m.status === "pago")
  .reduce((acc, item) => acc + Number(item.valor || 0), 0);

const totalPendente = mensalidades
  .filter((m) => m.status === "pendente")
  .reduce((acc, item) => acc + Number(item.valor || 0), 0);

const totalAtrasado = mensalidades
  .filter((m) => m.status === "atrasado")
  .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <main className="p-10">Carregando...</main>;
  console.log("EMPRESA:", empresa);
console.log("TRIAL_ATE:", empresa?.trial_ate);

  // 🔥 BLOQUEIO CORRIGIDO (COM TIMEZONE AJUSTADO)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const trial = empresa?.trial_ate ? new Date(empresa.trial_ate) : null;
  if (trial) trial.setHours(0, 0, 0, 0);

  if (empresa?.plano === "trial" && trial && hoje >= trial) {
    return (
      <main className="p-10 text-center">
        <h1 className="text-3xl font-bold text-red-600">
          Seu período gratuito terminou
        </h1>

        <p className="mt-4">
          Para continuar usando o sistema, escolha um plano.
        </p>

<button
  onClick={() => router.push("/planos")}
  className="mt-6 bg-green-600 text-white px-4 py-2 rounded"
>
  Assinar plano
</button>      
</main>
    );
  }

  return (
    <main className="p-10">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <button
          onClick={sair}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Sair
        </button>
      </div>

      <p className="mb-4">
        Empresa logada: <strong>{empresa?.nome_fantasia}</strong>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
  <div className="border rounded p-4 shadow-sm bg-white">
    <p className="text-gray-500 text-sm">Total recebido</p>
    <h2 className="text-2xl font-bold text-green-600">
      {moeda(totalRecebido)}
    </h2>
  </div>

  <div className="border rounded p-4 shadow-sm bg-white">
    <p className="text-gray-500 text-sm">Total pendente</p>
    <h2 className="text-2xl font-bold text-yellow-600">
      {moeda(totalPendente)}
    </h2>
  </div>

  <div className="border rounded p-4 shadow-sm bg-white">
    <p className="text-gray-500 text-sm">Total atrasado</p>
    <h2 className="text-2xl font-bold text-red-600">
      {moeda(totalAtrasado)}
    </h2>
  </div>

  <div className="border rounded p-4 shadow-sm bg-white">
    <p className="text-gray-500 text-sm">Total alunos</p>
    <h2 className="text-2xl font-bold">{alunos.length}</h2>
  </div>
</div>

<button
  onClick={
    gerarMensalidadesAutomaticas
  }
  className="mb-4 bg-purple-600 text-white px-4 py-2 rounded"
>
  Gerar mensalidades do mês
</button>

<div className="mb-6 flex gap-2 flex-wrap">

  <input
  placeholder="Buscar aluno..."
  value={buscaAluno}
  onChange={(e) => setBuscaAluno(e.target.value)}
  className="border p-2 rounded mb-6 w-full md:w-80"
/>

  <button
    onClick={() => setFiltroStatus("todos")}
    className={`px-4 py-2 rounded text-white ${
      filtroStatus === "todos"
        ? "bg-gray-800"
        : "bg-gray-500"
    }`}
  >
    Todos
  </button>

  <button
    onClick={() => setFiltroStatus("pago")}
    className={`px-4 py-2 rounded text-white ${
      filtroStatus === "pago"
        ? "bg-green-700"
        : "bg-green-500"
    }`}
  >
    Pagos
  </button>

  <button
    onClick={() => setFiltroStatus("pendente")}
    className={`px-4 py-2 rounded text-white ${
      filtroStatus === "pendente"
        ? "bg-yellow-600"
        : "bg-yellow-400"
    }`}
  >
    Pendentes
  </button>

  <button
    onClick={() => setFiltroStatus("atrasado")}
    className={`px-4 py-2 rounded text-white ${
      filtroStatus === "atrasado"
        ? "bg-red-700"
        : "bg-red-500"
    }`}
  >
    Atrasados
  </button>

</div>

      <div className="border p-4 rounded mb-6">
        <h2 className="font-bold mb-3">Nova Mensalidade</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={alunoSelecionado}
            onChange={(e) => setAlunoSelecionado(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Aluno</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>

          <input
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Valor"
            value={valor || ""}
            onChange={(e) => setValor(Number(e.target.value))}
            className="border p-2 rounded"
          />

          <input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={criarMensalidade}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Criar
        </button>
      </div>

      {mensalidades
  .filter((m) =>
  filtroStatus === "todos"
    ? true
    : m.status === filtroStatus
)
.filter((m) =>
  nomeAluno(m.aluno_id)
    .toLowerCase()
    .includes(buscaAluno.toLowerCase())
)
.map((m) => (
        <div key={m.id} className="border p-3 mb-2 rounded">
          <p><strong>Aluno:</strong> {nomeAluno(m.aluno_id)}</p>
          <p><strong>Valor:</strong> {moeda(Number(m.valor || 0))}</p>
<p>
  <strong>Vencimento:</strong>{" "}
  {m.vencimento}

  {m.status !== "pago" && (
    <>
      {diasParaVencimento(m.vencimento) === 0 && (
        <span className="ml-2 text-yellow-600 font-bold">
          (vence hoje)
        </span>
      )}

      {diasParaVencimento(m.vencimento) === 1 && (
        <span className="ml-2 text-orange-600 font-bold">
          (vence amanhã)
        </span>
      )}

      {diasParaVencimento(m.vencimento) > 1 &&
        diasParaVencimento(m.vencimento) <= 3 && (
          <span className="ml-2 text-red-600 font-bold">
            (vence em{" "}
            {diasParaVencimento(m.vencimento)} dias)
          </span>
      )}
    </>
  )}
</p>
<p>
  <strong>Status:</strong>{" "}

  <span
    className={`px-2 py-1 rounded text-white text-sm ${
      m.status === "pago"
        ? "bg-green-600"
        : m.status === "pendente"
        ? "bg-yellow-500"
        : "bg-red-600"
    }`}
  >
    {m.status}
  </span>
</p>

          {m.status !== "pago" && (
            <button
              onClick={() => marcarComoPago(m.id)}
              className="mt-2 bg-green-600 text-white px-3 py-1 rounded"
            >
              Marcar como pago
            </button>
          )}
        </div>
      ))}
    </main>
  );
}