import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Pega o email e o nome do recruta que o Quiz vai mandar
    const { email, name } = await request.json();

    // Dispara a ordem direta para o quartel general do Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Aqui ele vai ler a sua Chave do Resend escondida no seu arquivo .env
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}` 
      },
      body: JSON.stringify({
        from: 'PrimalBase <contato@primalbase.com.br>', // ⚠️ Substitua pelo email que você validou no Resend
        to: email,
        subject: 'Bem-vindo ao QG PrimalBase - Salve seu acesso!',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px 20px; text-align: center; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
            <h1 style="color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">PrimalBase</h1>
            
            <p style="font-size: 16px; color: #a1a1aa; max-width: 400px; margin: 0 auto 20px; line-height: 1.5;">
              Comandante <strong>${name}</strong>, bem-vindo à matilha. A sua biologia ancestral acaba de ser ativada.
            </p>
            
            <div style="background-color: #18181b; border: 1px dashed #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p style="font-size: 14px; color: #f59e0b; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase;">Sinalizador de Resgate</p>
              <p style="font-size: 14px; color: #d4d4d8; margin: 0;">
                Guarde este e-mail. Caso feche o navegador ou perca o aplicativo, o seu link direto e seguro para o QG é:
              </p>
              <p style="font-size: 18px; font-weight: bold; margin: 10px 0 0 0;">
                <a href="https://primalbase.com.br" style="color: #f4f4f5; text-decoration: none;">primalbase.com.br</a>
              </p>
            </div>
            
            <a href="https://primalbase.com.br" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-weight: 900; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">
              Acessar o QG Agora
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