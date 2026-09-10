import React from 'react';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-red-600">Política de Privacidade Institucional</h1>
        
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
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">1. Coleta e Tratamento de Dados (LGPD)</h3>
            <p className="text-sm leading-relaxed">Em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), o Primal Base coleta dados fornecidos voluntariamente durante o quiz interativo e o cadastro, com a finalidade exclusiva de prestação do serviço.</p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">2. Segurança e Compartilhamento</h3>
            <p className="text-sm leading-relaxed">Aplicamos protocolos de criptografia de ponta a ponta. Garantimos que as informações biológicas e de consumo dos nossos usuários não são vendidas, alugadas ou compartilhadas com terceiros não autorizados.</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">3. Uso de Cookies e Rastreamento</h3>
            <p className="text-sm leading-relaxed">Nossa infraestrutura utiliza cookies e pixels de plataformas de publicidade para métricas de desempenho, prevenção de fraudes e otimização da experiência de navegação do usuário.</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">4. Direitos do Titular</h3>
            <p className="text-sm leading-relaxed">O usuário retém controle total sobre suas informações, podendo solicitar a retificação, portabilidade ou a exclusão permanente de sua conta e dados em nossos servidores através do canal oficial de suporte.</p>
          </div>
        </div>
      </div>
    </div>
  );
}