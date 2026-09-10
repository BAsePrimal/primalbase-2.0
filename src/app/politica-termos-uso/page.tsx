import React from 'react';

export default function Termos() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-red-600">Termos e Condições de Uso</h1>
        
        {/* PREÂMBULO INSTITUCIONAL */}
        <section className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-lg font-semibold mb-3 text-zinc-200">IDENTIFICAÇÃO DA EMPRESA</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Estes Termos de Uso e Políticas de Privacidade são regidos, mantidos e operados por Primal Base, pessoa jurídica de direito privado, devidamente inscrita no CNPJ sob o nº 52.236.710/0001-19, com sede na Rua Inspetor Jaime Caldeira, 101 - Betim, MG. Para quaisquer dúvidas, solicitações ou exercício de direitos previstos na LGPD, o usuário poderá entrar em contato direto através do e-mail oficial: suporte@primalbase.com.br.
          </p>
        </section>

        {/* CLÁUSULAS */}
        <div className="space-y-6 text-zinc-300">
          <div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">1. Natureza da Aplicação</h3>
            <p className="text-sm leading-relaxed">O Primal Base é um software de tecnologia e leitura de dados focado no Protocolo Ancestral. Todo o conteúdo gerado possui caráter estritamente informativo e tecnológico.</p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">2. Isenção de Responsabilidade Médica</h3>
            <p className="text-sm leading-relaxed">Os relatórios e alertas emitidos pelo Scanner IA não constituem diagnóstico, prescrição ou aconselhamento médico. A responsabilidade por alergias e condições pré-existentes é inteiramente do usuário.</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">3. Propriedade Intelectual e Licenciamento</h3>
            <p className="text-sm leading-relaxed">Todo o algoritmo, design, textos dinâmicos e inteligência artificial são de propriedade exclusiva do Primal Base. É terminantemente proibida a cópia, reprodução ou engenharia reversa do sistema.</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">4. Política de Assinaturas</h3>
            <p className="text-sm leading-relaxed">O acesso aos recursos premium é gerido de forma automatizada. A renovação de planos ocorre conforme o ciclo contratado, e o usuário é responsável por gerenciar cancelamentos diretamente na plataforma antes da data de cobrança.</p>
          </div>
        </div>
      </div>
    </div>
  );
}