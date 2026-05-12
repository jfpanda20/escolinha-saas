import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 🔥 CHAVE DIRETA (DEPOIS PODE VOLTAR PRO .env)
    const API_KEY = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjY2MzY3ZTAwLTk1MzItNDJmMC05YmE4LTQ0YzE5YTJiZGE1Mjo6JGFhY2hfODdhNjBlMDItOGU0Zi00ZjIyLTg1NmUtNzE2Y2Q3YTgzNjJj";

    const body = await req.json();
    const { nome, email, valor } = body;

    // 🎯 DEFINE PLANO PELO VALOR
    let plano = "30";

    if (valor == 39.9) plano = "30";
    else if (valor == 59.9) plano = "60";
    else if (valor == 79.9) plano = "100";
    else if (valor == 99.9) plano = "ilimitado";

    // 🔹 CRIAR CLIENTE
    const clienteRes = await fetch(
      "https://api-sandbox.asaas.com/v3/customers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: API_KEY,
        },
        body: JSON.stringify({
          name: nome || "Cliente Teste",
          email: email || "teste@email.com",
          cpfCnpj: "49563815000178",
        }),
      }
    );

    const clienteText = await clienteRes.text();
    console.log("STATUS CLIENTE:", clienteRes.status);
    console.log("RESPOSTA CLIENTE:", clienteText);

    let cliente;
    try {
      cliente = JSON.parse(clienteText);
    } catch {
      return NextResponse.json(
        { error: "Erro ao interpretar cliente" },
        { status: 500 }
      );
    }

    if (!cliente.id) {
      return NextResponse.json(
        {
          error: "Erro ao criar cliente",
          detalhe: cliente,
        },
        { status: 400 }
      );
    }

    // 🔹 CRIAR COBRANÇA
    const cobrancaRes = await fetch(
      "https://api-sandbox.asaas.com/v3/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: API_KEY,
        },
        body: JSON.stringify({
          customer: cliente.id,
          billingType: "UNDEFINED",
          value: Number(valor) || 39.9,
          dueDate: new Date().toISOString().split("T")[0],

          // 🔥 IDENTIFICAÇÃO PARA WEBHOOK
          description: `PLANO_${plano}`,
          externalReference: email,
        }),
      }
    );

    const cobrancaText = await cobrancaRes.text();
    console.log("STATUS COBRANCA:", cobrancaRes.status);
    console.log("RESPOSTA COBRANCA:", cobrancaText);

    let cobranca;
    try {
      cobranca = JSON.parse(cobrancaText);
    } catch {
      return NextResponse.json(
        { error: "Erro ao interpretar cobrança" },
        { status: 500 }
      );
    }

    if (!cobranca.invoiceUrl) {
      return NextResponse.json(
        {
          error: "Erro ao gerar cobrança",
          detalhe: cobranca,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      url: cobranca.invoiceUrl,
    });

  } catch (error) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json(
      { error: "Erro interno na API" },
      { status: 500 }
    );
  }
}