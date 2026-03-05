import { supabase } from './supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Coloque aqui o MESMO e-mail que você usou para se cadastrar no Resend
const ADMIN_EMAIL = 'joaovitorcoura@gmail.com'; 

export async function logError(serviceName: string, error: any, userEmail: string = 'Email não identificado') {
  const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

  try {
    // 1. Guarda na Caixa Preta do Supabase
    await supabase.from('error_logs').insert([
      {
        service_name: serviceName,
        error_message: errorMessage,
        user_email: userEmail,
      }
    ]);

    // 2. Dispara a Sirene pro seu E-mail
    await resend.emails.send({
      from: 'PrimalBase Admin <onboarding@resend.dev>', // Remetente padrão do Resend (não mude isso no plano grátis)
      to: ADMIN_EMAIL,
      subject: `🚨 ALERTA PRIMALBASE: Falha no ${serviceName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #18181b; color: #f4f4f5; border-radius: 10px;">
          <h2 style="color: #ef4444;">⚠️ Falha Detectada no Sistema</h2>
          <hr style="border-color: #3f3f46;"/>
          <p><strong>Serviço:</strong> ${serviceName}</p>
          <p><strong>Usuário Afetado:</strong> ${userEmail}</p>
          <p><strong>Motivo do Erro:</strong> <span style="color: #fbbf24;">${errorMessage}</span></p>
          <br/>
          <p style="font-size: 12px; color: #a1a1aa;">Acesse o painel do Supabase para marcar este erro como resolvido.</p>
        </div>
      `
    });
    
    console.log(`[LOGGER] Erro salvo e alerta enviado para ${ADMIN_EMAIL}`);
  } catch (logErr) {
    console.error('[LOGGER] Falha catastrófica ao tentar logar o erro original:', logErr);
  }
}