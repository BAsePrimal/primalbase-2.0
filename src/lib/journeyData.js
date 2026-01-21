export const JOURNEY_DATA = {
  male: {
    title: "Protocolo Leão 🦁",
    description: "Força, Testosterona e Domínio Mental.",
    days: [
      // --- SEMANA 1: A RECONEXÃO ---
      { 
        day: 1, 
        title: "O Choque de Realidade", 
        lesson: "A vida moderna te deixou dormente. Ar condicionado e açúcar. Hoje vamos dar um choque no sistema. A fome não é emergência, e o frio não é inimigo.",
        tasks: [
          { id: "shower_1", label: "Banho de Contraste (30s Gelado no fim)", type: "check" },
          { id: "sun_1", label: "20 min Sol (Sem óculos)", type: "check" },
          { id: "detox_1", label: "Zero Porn e Zero Açúcar", type: "check" }
        ] 
      },
      { 
        day: 2, 
        title: "A Visão do Predador", 
        lesson: "O homem moderno vive sentado. Hoje resgatamos a postura ancestral. Além disso, a gordura bloqueia a saciedade; usamos café com óleo de coco para energia.",
        tasks: [
          { id: "coffee_2", label: "Café Primal (com Óleo de Coco)", type: "check" },
          { id: "squat_2", label: "3 min Deep Squat (Cócoras)", type: "check" },
          { id: "sun_2", label: "Sol da Manhã (Regular Sono)", type: "check" }
        ] 
      },
      { 
        day: 3, 
        title: "Domínio Digital", 
        lesson: "Acordar olhando o celular gera ansiedade. Retome o controle. Sobre a fome: é a Grelina. Se resistir 1h, a onda passa.",
        tasks: [
          { id: "airplane_3", label: "1h Modo Avião ao acordar", type: "check" },
          { id: "diet_3", label: "Dieta Limpa (Carne/Ovos/Frutas)", type: "check" },
          { id: "salt_3", label: "Água com pitada de Sal", type: "check" }
        ] 
      },
      { 
        day: 4, 
        title: "Força da Gravidade", 
        lesson: "Ficar pendurado alinha sua coluna e fortalece sua pegada (grip), indicador de testosterona. Use seu corpo ou perca ele.",
        tasks: [
          { id: "hang_4", label: "Dead Hang (Pendurar na barra)", type: "check" },
          { id: "sun_4", label: "20 min Sol UVB (Horário de Pico)", type: "check" },
          { id: "read_4", label: "10 min Leitura Técnica", type: "check" }
        ] 
      },
      { 
        day: 5, 
        title: "O Escudo de Sono", 
        lesson: "GH e Testosterona são fabricados no sono profundo. A luz do celular à noite destrói sua melatonina. Hoje blindamos sua recuperação.",
        tasks: [
          { id: "sunset_5", label: "Zero Telas após 21h", type: "check" },
          { id: "coffee_5", label: "Sem cafeína após as 14h", type: "check" },
          { id: "breath_5", label: "5 min Respiração Profunda", type: "check" }
        ] 
      },
      { 
        day: 6, 
        title: "Preparação para Caçada", 
        lesson: "Amanhã faremos o primeiro jejum. O segredo é mineral: Sal impede dor de cabeça. Hoje aumentamos o desconforto no banho.",
        tasks: [
          { id: "salt_pre_6", label: "Pré-treino: Água + Sal", type: "check" },
          { id: "shower_hard_6", label: "Banho Gelado (45s)", type: "check" },
          { id: "grounding_6", label: "10 min Grounding (Pés na terra)", type: "check" }
        ] 
      },
      { 
        day: 7, 
        title: "O Primeiro Teste (16h)", 
        lesson: "Pule o café da manhã ou o jantar. O objetivo é sentir a grelina (fome) subir e descer sem se desesperar. Você não é um robô.",
        tasks: [
          { id: "fasting_16", label: "Jejum de 16h (Adaptação)", type: "timer", goal: 16 },
          { id: "sun_7", label: "Sol durante o Jejum", type: "check" },
          { id: "silence_7", label: "10 min Silêncio Total", type: "check" }
        ] 
      },
      // --- SEMANA 2: DISCIPLINA ---
      { 
        day: 8, 
        title: "A Retomada", 
        lesson: "Você venceu a primeira semana. Agora, aumentamos a aposta. O banho gelado é treino de resiliência mental.",
        tasks: [
          { id: "shower_8", label: "Banho Gelado (1 min e meio)", type: "check" },
          { id: "coffee_8", label: "Café Turbo (Manteiga/Coco)", type: "check" },
          { id: "pushups_8", label: "20 Flexões ao acordar", type: "check" }
        ] 
      },
      { 
        day: 9, 
        title: "Aterramento (Grounding)", 
        lesson: "O estresse nos carrega de íons positivos. O contato com a terra descarrega isso e baixa o Cortisol. Menos cortisol = Mais Testosterona.",
        tasks: [
          { id: "grounding_9", label: "15 min Pés na Grama/Terra", type: "check" },
          { id: "sun_9", label: "20 min Sol", type: "check" },
          { id: "visceras_9", label: "Comer Vísceras ou Carne Vermelha", type: "check" }
        ] 
      },
      { 
        day: 10, 
        title: "Modo Caçada (Sprints)", 
        lesson: "O homem primitivo corria rápido para caçar. Tiros de velocidade (Sprints) ativam fibras rápidas e liberam GH.",
        tasks: [
          { id: "sprints_10", label: "4 Tiros de 100m (Máx Velocidade)", type: "check" },
          { id: "shower_10", label: "Banho Gelado Pós-treino", type: "check" },
          { id: "salt_10", label: "Dobrar Água com Sal", type: "check" }
        ] 
      },
      { 
        day: 11, 
        title: "Foco Laser", 
        lesson: "Sua mente está limpa. Elimine distrações e foque 100% em uma tarefa difícil. Quem domina a atenção, domina o dinheiro.",
        tasks: [
          { id: "deepwork_11", label: "90 min Trabalho Sem Celular", type: "check" },
          { id: "sun_11", label: "30 min Sol UVB (Pico)", type: "check" },
          { id: "social_11", label: "Limite: 15 min Redes Sociais", type: "check" }
        ] 
      },
      { 
        day: 12, 
        title: "O Desafio do Tédio", 
        lesson: "Estamos viciados em estímulo. Hoje treinamos o silêncio. Ficar sozinho com seus pensamentos é o maior teste moderno.",
        tasks: [
          { id: "boredom_12", label: "15 min Olhando p/ Parede (Nada mais)", type: "check" },
          { id: "coffee_12", label: "Café Preto (Apenas)", type: "check" },
          { id: "hang_12", label: "2 min Dead Hang (Acumulado)", type: "check" }
        ] 
      },
      { 
        day: 13, 
        title: "Preparação para Guerra", 
        lesson: "Amanhã será o marco de 24h sem comer. Coma bem hoje para saciar. O corpo aguenta, é a mente que tenta desistir.",
        tasks: [
          { id: "feast_13", label: "Jantar Reforçado (Carne/Ovos)", type: "check" },
          { id: "sleep_13", label: "Dormir Cedo (Hormônios)", type: "check" },
          { id: "write_13", label: "Escrever: 'Eu venço a fome'", type: "check" }
        ] 
      },
      { 
        day: 14, 
        title: "O Guerreiro em Jejum (24h)", 
        lesson: "Chegamos. 24 Horas. A Autofagia limpa células velhas e o GH dispara. Você está hackeando sua biologia.",
        tasks: [
          { id: "fasting_24", label: "Jejum de 24h (Autofagia)", type: "timer", goal: 24 },
          { id: "sun_14", label: "Sol (Energia Fotovoltaica)", type: "check" },
          { id: "salt_14", label: "Pitada de Sal a cada 3h", type: "check" }
        ] 
      },
      // --- SEMANA 3: IDENTIDADE ---
      { 
        day: 15, 
        title: "A Muralha de Dopamina", 
        lesson: "Cuidado com o 'só um pouquinho'. Pornografia e açúcar viciam. Mantenha a muralha alta.",
        tasks: [
          { id: "novice_15", label: "Vigilância Total (Zero Vícios)", type: "check" },
          { id: "shower_15", label: "Banho Gelado (2 min)", type: "check" },
          { id: "coffee_15", label: "Café Primal", type: "check" }
        ] 
      },
      { 
        day: 16, 
        title: "Instinto Alimentar", 
        lesson: "O leão come até saciar. Sinta o gosto real da comida. Respeite o animal que te nutriu.",
        tasks: [
          { id: "eat_16", label: "Refeição Consciente (Sem Celular)", type: "check" },
          { id: "sun_16", label: "20 min Sol", type: "check" },
          { id: "rucking_16", label: "20 min Caminhada com Mochila", type: "check" }
        ] 
      },
      { 
        day: 17, 
        title: "Clareza Espiritual", 
        lesson: "Jejuns e cetose trazem clareza. Use a queima de gordura para resolver problemas difíceis.",
        tasks: [
          { id: "solve_17", label: "Definir 1 Meta Futura Clara", type: "check" },
          { id: "hang_17", label: "Dead Hang (Até a falha)", type: "check" },
          { id: "water_17", label: "Hidratação com Sal", type: "check" }
        ] 
      },
      { 
        day: 18, 
        title: "Máquina de Guerra", 
        lesson: "Com GH alto, seu corpo preserva massa magra. Treine pesado hoje. Sinalize: 'Somos fortes'.",
        tasks: [
          { id: "train_18", label: "Treino Intenso", type: "check" },
          { id: "sun_18", label: "30 min Sol UVB", type: "check" },
          { id: "protein_18", label: "Dobro de Proteína Pós-Treino", type: "check" }
        ] 
      },
      { 
        day: 19, 
        title: "O Manifesto", 
        lesson: "Quem é você agora? Escreva quem você quer ser daqui para frente.",
        tasks: [
          { id: "write_19", label: "Escrever 3 Princípios Inegociáveis", type: "check" },
          { id: "airplane_19", label: "Tarde Livre de Notificações", type: "check" },
          { id: "grounding_19", label: "20 min Grounding", type: "check" }
        ] 
      },
      { 
        day: 20, 
        title: "Imersão Total", 
        lesson: "Amanhã o ciclo fecha. Hoje, viva como se a cidade não existisse. Coma da terra, pise na terra.",
        tasks: [
          { id: "nature_20", label: "Ir a um Parque ou Dobrar Grounding", type: "check" },
          { id: "shower_20", label: "Banho Gelado (Máximo Frio)", type: "check" },
          { id: "visualize_20", label: "Visualizar os próximos 6 meses", type: "check" }
        ] 
      },
      { 
        day: 21, 
        title: "A Graduação", 
        lesson: "Missão Cumprida. Você não é mais refém. Fechamos com um Jejum de Renovação.",
        tasks: [
          { id: "fasting_final", label: "Jejum de 24h (Selo Final)", type: "timer", goal: 24 },
          { id: "sun_21", label: "30 min Sol da Vitória", type: "check" },
          { id: "photo_21", label: "Tirar Foto (Comparar com Dia 1)", type: "check" }
        ] 
      }
    ]
  },
  female: {
    title: "Protocolo Leoa 🐆",
    description: "Hormônios, Viço e Vitalidade.",
    days: [
      // --- SEMANA 1: O DESPERTAR DA LEOA (ADAPTAÇÃO) ---
      { 
        day: 1, 
        title: "O Ciclo Solar", 
        lesson: "Sua beleza e hormônios dependem do ciclo circadiano. O raio UVA da manhã nos seus olhos regula a melatonina. Sono de beleza começa ao acordar. A fome não é emergência, é apenas sinal.",
        tasks: [
          { id: "shower_1", label: "Banho de Contraste (Pele/Circulação)", type: "check" },
          { id: "sun_1", label: "20 min Sol (Sem óculos)", type: "check" },
          { id: "detox_1", label: "Zero Açúcar (Desinflamar)", type: "check" }
        ] 
      },
      { 
        day: 2, 
        title: "Matéria-Prima", 
        lesson: "Estrogênio e Progesterona são feitos de COLESTEROL. Mulher que não come gordura boa (óleo de coco, ovos) tem pele seca e humor oscilante. Alimente sua feminilidade.",
        tasks: [
          { id: "coffee_2", label: "Café com Óleo de Coco/Manteiga", type: "check" },
          { id: "squat_2", label: "3 min Deep Squat (Pelve/Postura)", type: "check" },
          { id: "sun_2", label: "Sol da Manhã (Regular Hormônios)", type: "check" }
        ] 
      },
      { 
        day: 3, 
        title: "Ritmo Sagrado", 
        lesson: "O corpo feminino sente mais o estresse. Cortisol alto rouba a matéria-prima dos hormônios sexuais. O resultado é inchaço e cansaço. Hoje retomamos o controle da dopamina.",
        tasks: [
          { id: "airplane_3", label: "1h Modo Avião ao acordar", type: "check" },
          { id: "diet_3", label: "Dieta Limpa (Carne/Ovos/Frutas)", type: "check" },
          { id: "salt_3", label: "Água com pitada de Sal (Minerais)", type: "check" }
        ] 
      },
      { 
        day: 4, 
        title: "Postura Real", 
        lesson: "A gravidade molda seu corpo. Ficar pendurada alinha a coluna, abre os ombros e melhora a postura dos seios e costas. Postura é linguagem corporal de poder.",
        tasks: [
          { id: "hang_4", label: "Dead Hang (Pendurar na barra)", type: "check" },
          { id: "sun_4", label: "20 min Sol UVB (Horário de Pico)", type: "check" },
          { id: "read_4", label: "10 min Leitura (Nutrir a mente)", type: "check" }
        ] 
      },
      { 
        day: 5, 
        title: "Sono de Beleza", 
        lesson: "Durante o sono profundo, o HGH (Hormônio do Crescimento) repara o colágeno da pele. Dormir mal envelhece mais rápido que o sol. Hoje blindamos sua noite.",
        tasks: [
          { id: "sunset_5", label: "Zero Telas após 21h", type: "check" },
          { id: "coffee_5", label: "Sem cafeína após as 14h", type: "check" },
          { id: "breath_5", label: "5 min Respiração (Reduzir Cortisol)", type: "check" }
        ] 
      },
      { 
        day: 6, 
        title: "Preparação Intuitiva", 
        lesson: "Amanhã faremos um jejum curto. O segredo para não ter dor de cabeça é o Sal. O banho gelado hoje ativa a circulação e dá viço à pele.",
        tasks: [
          { id: "salt_pre_6", label: "Água + Sal (Hidratação)", type: "check" },
          { id: "shower_hard_6", label: "Banho Gelado (45s)", type: "check" },
          { id: "grounding_6", label: "10 min Grounding (Pés na terra)", type: "check" }
        ] 
      },
      { 
        day: 7, 
        title: "Ciclo de Limpeza (14h)", 
        lesson: "Jejum para mulheres serve para desinflamar e limpar células (autofagia). Começamos com 14h, um período seguro que baixa a insulina sem estressar o ciclo hormonal.",
        tasks: [
          { id: "fasting_14", label: "Jejum de 14h (Suave)", type: "timer", goal: 14 },
          { id: "sun_7", label: "Sol durante o Jejum", type: "check" },
          { id: "silence_7", label: "10 min Silêncio (Calma mental)", type: "check" }
        ] 
      },
      // --- SEMANA 2: A DISCIPLINA NATURAL (INTENSIDADE) ---
      { 
        day: 8, 
        title: "Fluxo Vital", 
        lesson: "Você desinflamou na primeira semana. Agora ativamos o fluxo. O banho gelado não é sofrimento, é terapia para fechar os poros, ativar a tireoide e acordar o cérebro.",
        tasks: [
          { id: "shower_8", label: "Banho Gelado (1 min)", type: "check" },
          { id: "coffee_8", label: "Café Turbo (Energia)", type: "check" },
          { id: "move_8", label: "20 Agachamentos ao acordar", type: "check" }
        ] 
      },
      { 
        day: 9, 
        title: "Aterramento (Grounding)", 
        lesson: "O estresse acumula carga positiva (inflamação e retenção de líquido). Pisar na terra descarrega isso. Menos cortisol significa barriga menos inchada e mente clara.",
        tasks: [
          { id: "grounding_9", label: "15 min Pés na Grama/Terra", type: "check" },
          { id: "sun_9", label: "20 min Sol", type: "check" },
          { id: "protein_9", label: "Foco em Proteína (Cabelo/Unhas)", type: "check" }
        ] 
      },
      { 
        day: 10, 
        title: "Sprints (Anti-Aging)", 
        lesson: "Corridas de explosão (Sprints) são a melhor forma natural de liberar HGH (Hormônio da juventude). Não é sobre queimar caloria, é sobre sinalização hormonal.",
        tasks: [
          { id: "sprints_10", label: "4 Tiros Curtos (Máx Velocidade)", type: "check" },
          { id: "shower_10", label: "Banho Gelado Pós-treino", type: "check" },
          { id: "salt_10", label: "Hidratação com Sal", type: "check" }
        ] 
      },
      { 
        day: 11, 
        title: "Foco Intuitivo", 
        lesson: "Sua mente está limpa. Mulheres são multitarefa, mas isso cansa. Hoje treine o mono-foco. Uma coisa de cada vez, com excelência.",
        tasks: [
          { id: "deepwork_11", label: "90 min Trabalho Sem Celular", type: "check" },
          { id: "sun_11", label: "30 min Sol UVB (Pico)", type: "check" },
          { id: "social_11", label: "Limite: 15 min Redes Sociais", type: "check" }
        ] 
      },
      { 
        day: 12, 
        title: "Silêncio Fértil", 
        lesson: "Estamos viciadas em ruído. O silêncio regenera os neurônios. Ficar sozinha com seus pensamentos fortalece sua intuição.",
        tasks: [
          { id: "boredom_12", label: "15 min Olhando p/ Paisagem (Nada mais)", type: "check" },
          { id: "coffee_12", label: "Café Preto (Apenas)", type: "check" },
          { id: "hang_12", label: "2 min Dead Hang (Acumulado)", type: "check" }
        ] 
      },
      { 
        day: 13, 
        title: "Nutrição Profunda", 
        lesson: "Amanhã faremos um jejum de renovação (24h). Nutra seu corpo hoje com gorduras boas e proteínas. Diga ao seu corpo que ele está seguro para poder limpar-se amanhã.",
        tasks: [
          { id: "feast_13", label: "Jantar Nutritivo (Carne/Ovos)", type: "check" },
          { id: "sleep_13", label: "Dormir Cedo (Beleza)", type: "check" },
          { id: "write_13", label: "Escrever: 'Eu controlo meu corpo'", type: "check" }
        ] 
      },
      { 
        day: 14, 
        title: "Renovação Celular (24h)", 
        lesson: "24 Horas. A Autofagia (comer a si mesmo) recicla proteínas velhas da pele e órgãos. É o skincare mais caro do mundo, feito de graça pelo seu corpo.",
        tasks: [
          { id: "fasting_24", label: "Jejum de 24h (Renovação)", type: "timer", goal: 24 },
          { id: "sun_14", label: "Sol (Energia)", type: "check" },
          { id: "salt_14", label: "Pitada de Sal a cada 3h", type: "check" }
        ] 
      },
      // --- SEMANA 3: A NOVA MULHER (IDENTIDADE) ---
      { 
        day: 15, 
        title: "A Muralha", 
        lesson: "Açúcar e validação externa (likes) viciam. Mantenha a muralha alta. Sua energia vital deve ir para seus projetos e sua vida real, não para a tela.",
        tasks: [
          { id: "novice_15", label: "Vigilância (Zero Açúcar/Vícios)", type: "check" },
          { id: "shower_15", label: "Banho Gelado (2 min)", type: "check" },
          { id: "coffee_15", label: "Café Primal", type: "check" }
        ] 
      },
      { 
        day: 16, 
        title: "Instinto", 
        lesson: "Coma quando tiver fome real, pare quando saciar. Seu paladar limpou. Sinta o gosto real da comida e respeite o animal que te nutriu.",
        tasks: [
          { id: "eat_16", label: "Refeição Consciente (Sem Celular)", type: "check" },
          { id: "sun_16", label: "20 min Sol", type: "check" },
          { id: "walk_16", label: "20 min Caminhada", type: "check" }
        ] 
      },
      { 
        day: 17, 
        title: "Clareza", 
        lesson: "Jejuns e cetose trazem clareza mental. Use esse estado limpo para resolver problemas ou criar algo novo. Sua intuição está afiada.",
        tasks: [
          { id: "solve_17", label: "Definir 1 Meta Futura", type: "check" },
          { id: "hang_17", label: "Dead Hang (Até a falha)", type: "check" },
          { id: "water_17", label: "Hidratação com Sal", type: "check" }
        ] 
      },
      { 
        day: 18, 
        title: "Força Feminina", 
        lesson: "Músculo é o órgão da longevidade e protege seus ossos. Sentir-se forte fisicamente aumenta sua confiança em qualquer sala que você entrar.",
        tasks: [
          { id: "train_18", label: "Treino de Força (Pesos)", type: "check" },
          { id: "sun_18", label: "30 min Sol UVB", type: "check" },
          { id: "protein_18", label: "Dobro de Proteína Pós-Treino", type: "check" }
        ] 
      },
      { 
        day: 19, 
        title: "O Manifesto", 
        lesson: "Quem é você agora? A mulher cansada ficou para trás. Uma Leoa define suas regras e limites. Escreva quem você quer ser.",
        tasks: [
          { id: "write_19", label: "Escrever 3 Princípios Inegociáveis", type: "check" },
          { id: "airplane_19", label: "Tarde Livre de Notificações", type: "check" },
          { id: "grounding_19", label: "20 min Grounding", type: "check" }
        ] 
      },
      { 
        day: 20, 
        title: "Imersão Natural", 
        lesson: "Você é um ser biológico. O concreto e o plástico nos adoecem. Hoje, busque a natureza. Respire ar puro. Conecte-se com a fonte.",
        tasks: [
          { id: "nature_20", label: "Ir a um Parque ou Dobrar Grounding", type: "check" },
          { id: "shower_20", label: "Banho Gelado (Máximo Frio)", type: "check" },
          { id: "visualize_20", label: "Visualizar os próximos 6 meses", type: "check" }
        ] 
      },
      { 
        day: 21, 
        title: "A Graduação", 
        lesson: "Ciclo completo. Você ativou a autofagia, regulou hormônios com o sol e blindou sua mente. Você é livre. Fechamos com um Jejum de Renovação.",
        tasks: [
          { id: "fasting_final", label: "Jejum de 24h (Selo Final)", type: "timer", goal: 24 },
          { id: "sun_21", label: "30 min Sol da Vitória", type: "check" },
          { id: "photo_21", label: "Tirar Foto (Comparar com Dia 1)", type: "check" }
        ] 
      }
    ]
  }
};
