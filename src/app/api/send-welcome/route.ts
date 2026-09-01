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
        subject: 'Seu Acesso ao Primal Base | Protocolo Ancestral',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px 20px; text-align: center; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
            <h1 style="color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Primal Base</h1>
            
            <p style="font-size: 16px; color: #a1a1aa; max-width: 400px; margin: 0 auto 20px; line-height: 1.5;">
              <strong>${name}</strong>, seu acesso foi ativado. O processo de reprogramação biológica começa agora.
            </p>
            
            <div style="background-color: #18181b; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p style="font-size: 14px; color: #f59e0b; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase;">Link de Acesso Seguro</p>
              <p style="font-size: 14px; color: #d4d4d8; margin: 0;">
                Guarde este e-mail. Utilize o link abaixo para acessar o seu painel a qualquer momento e garantir a continuidade da sua rotina:
              </p>
              <p style="font-size: 18px; font-weight: bold; margin: 15px 0 0 0;">
                <a href="https://primalbase.com.br" style="color: #f4f4f5; text-decoration: none; border-bottom: 1px solid #f59e0b; padding-bottom: 2px;">primalbase.com.br</a>
              </p>
            </div>
            
            <a href="https://primalbase.com.br" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-weight: 900; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">
              Acessar Meu Protocolo
            </a>
          </div>
        `
      })
    });

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Falha no disparo do email:', error);
    return NextResponse.json({ error: 'Falha ao enviar e-mail' }, { status: 500 });
  }
}