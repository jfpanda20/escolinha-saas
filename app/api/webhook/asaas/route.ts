import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 🔥 BODY DO WEBHOOK
    const body = await req.json();

    console.log("📡 WEBHOOK RECEBIDO:", body);

    const event = body.event;
    const payment = body.payment;

    // ⚠️ PROTEÇÃO
    if (!payment || !payment.externalReference) {
      console.log("⚠️ DADOS INCOMPLETOS");

      return NextResponse.json({
        ok: true,
      });
    }

    // 🔥 DADOS PAGAMENTO
    const email = payment.externalReference;
    const valor = Number(payment.value);

    // 🎯 DEFINIR PLANO
    let plano = "30";

    if (valor === 39.9) plano = "30";
    else if (valor === 59.9) plano = "60";
    else if (valor === 79.9) plano = "100";
    else if (valor === 99.9) plano = "ilimitado";

    // ✅ PAGAMENTO CONFIRMADO
    if (event === "PAYMENT_CONFIRMED") {
      const { error } = await supabase
        .from("empresas")
        .update({
          plano: plano,
          status: "ativo",
        })
        .eq("email", email);

      if (error) {
        console.log("❌ ERRO SUPABASE:", error);
      } else {
        console.log("✅ PLANO LIBERADO:", email, plano);
      }
    }

    // 🚫 PAGAMENTO ATRASADO
    if (event === "PAYMENT_OVERDUE") {
      const { error } = await supabase
        .from("empresas")
        .update({
          status: "bloqueado",
        })
        .eq("email", email);

      if (error) {
        console.log("❌ ERRO BLOQUEIO:", error);
      } else {
        console.log("🚫 CLIENTE BLOQUEADO:", email);
      }
    }

    return NextResponse.json({
      ok: true,
    });

  } catch (error) {
    console.error("🔥 ERRO WEBHOOK:", error);

    return NextResponse.json(
      { error: "Erro interno webhook" },
      { status: 500 }
    );
  }
}