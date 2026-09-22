import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}` 
      },
      body: JSON.stringify({
        from: 'Primal Base <suporte@primalbase.com.br>', 
        to: email,
        // 👇 Assunto atualizado e focado na liberação do acesso
        subject: 'Seu acesso ao Primal Base está liberado 🥩',
        // 👇 Novo HTML Premium injetado
        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso Liberado</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 48px 0 24px 0;">
              <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">PRIMAL BASE</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <!-- Badge -->
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
                  Acesso Liberado
                </span>
              </div>
              
              <!-- Greeting & Main Text -->
              <p style="color: #e4e4e7; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                <strong>${name}</strong>, sua conta foi ativada com sucesso. O seu painel exclusivo já está pronto para uso e todas as ferramentas premium foram desbloqueadas.
              </p>
              
              <!-- Security Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 40px;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <h3 style="color: #f59e0b; margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Link de Acesso Seguro</h3>
                    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0;">
                      Guarde este e-mail. Utilize o botão abaixo para entrar no seu aplicativo a qualquer momento e manter o controle da sua rotina.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="https://primalbase.com.br" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-size: 15px; font-weight: bold; text-decoration: none; padding: 18px 36px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Acessar Meu Aplicativo
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px; background-color: #09090b; border-top: 1px solid #27272a;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                &copy; 2026 Primal Base. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      })
    });

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Falha no disparo do email:', error);
    return NextResponse.json({ error: 'Falha ao enviar e-mail' }, { status: 500 });
  }
}