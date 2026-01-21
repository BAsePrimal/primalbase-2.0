'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';
import { 
  ShoppingCart, Utensils, Check, Flame, 
  Coffee, Droplets, Beef, Carrot, 
  Milk, Package, Trash2, Sparkles, Circle, Lock 
} from 'lucide-react';

// --- TIPAGENS ---
interface Food {
  id: number;
  name: string;
  category: string;
  goal_tag: string;
  meal_type?: string;
  status?: string;
}

interface Meal {
  main: Food;
  fat: Food | null;
  sides: Food[];
  desserts: Food[];
}

interface DayPlan {
  day: string;
  breakfast: { name: string; desc: string; category: string };
  lunch: Meal;
  dinner: Meal;
}

interface ShoppingItem {
  name: string;
  category: string;
  checked: boolean;
}

export default function NutritionPage() {
  // Estados de Controle
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Estados de Dados
  const [user, setUser] = useState<any>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [menu, setMenu] = useState<DayPlan[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [userGoal, setUserGoal] = useState<string>('');

  // --- 1. AUTENTICAÇÃO E INICIALIZAÇÃO ---
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) setUser(authUser);
    };
    getUser();
  }, []);

  // Passo B: Carregar dados
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', user.id)
          .single();
        
        if (profileError) {
            console.error('Erro ao ler perfil:', profileError);
        }

        // Verificar status de assinante
        setIsSubscriber(profile?.is_subscriber || false);

        // 🎯 REGRA 1: MAPEAMENTO DE OBJETIVO (Normalização)
        const raw = (profile?.goal || profile?.goal_type || '').toLowerCase();
        const currentGoal = (
          raw.includes('ganho') || 
          raw.includes('massa') || 
          raw.includes('hipertrofia') || 
          raw.includes('crescer')
        ) ? 'ganho' : 'perda';
        
        console.log('🎯 Objetivo RAW:', raw); 
        console.log('🎯 Objetivo NORMALIZADO:', currentGoal);
        
        setUserGoal(currentGoal);

        const { data: existingPlan } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingPlan && existingPlan.goal_type !== currentGoal) {
          console.log('🔄 Objetivo mudou! Regenerando...');
          await supabase.from('meal_plans').delete().eq('id', existingPlan.id);
          await generateAndSaveMenu(currentGoal);
          return;
        }

        if (existingPlan) {
          const parsedWeek = typeof existingPlan.week_plan === 'string' ? JSON.parse(existingPlan.week_plan) : existingPlan.week_plan;
          const parsedList = typeof existingPlan.shopping_list === 'string' ? JSON.parse(existingPlan.shopping_list) : existingPlan.shopping_list;
          setMenu(parsedWeek || []);
          setShoppingList(parsedList || []);
        } else {
          await generateAndSaveMenu(currentGoal);
        }
      } catch (err) {
        console.error('❌ Erro Crítico:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // --- 3. GERAÇÃO INTELIGENTE COM ARQUITETURA DE SLOTS + REGRAS DE NEGÓCIO ---
  const generateAndSaveMenu = async (goal: string) => {
    if (!user) return;
    setLoading(true);

    try {
      // 🎯 REGRA 2: A REGRA DE OURO DO FILTRO
      // Passo 1: Buscar alimentos onde status != 'banned'
      const { data: allFoods } = await supabase
        .from('foods')
        .select('*')
        .neq('status', 'banned');
      
      if (!allFoods || allFoods.length === 0) throw new Error('Banco vazio!');

      console.log('📦 Total de alimentos (sem banned):', allFoods.length);

      // Passo 2 e 3: Filtrar baseado no objetivo
      let foods: Food[];
      
      if (goal === 'perda') {
        // MODO SECAR: EXCLUIR itens com goal_tag == 'hipertrofia'
        foods = allFoods.filter((f: Food) => f.goal_tag !== 'hipertrofia');
        console.log('🔥 MODO SECAR ATIVADO - Alimentos de hipertrofia EXCLUÍDOS');
        console.log('📦 Alimentos disponíveis após filtro:', foods.length);
      } else {
        // MODO CRESCER: Manter lista completa (Ambos + Hipertrofia)
        foods = allFoods;
        console.log('💪 MODO CRESCER ATIVADO - Todos os alimentos disponíveis');
        console.log('📦 Alimentos disponíveis:', foods.length);
      }

      // --- FUNÇÃO DE EMBARALHAMENTO (Fisher-Yates) ---
      const shuffle = <T,>(arr: T[]): T[] => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // --- 🎯 NOVA REGRA: PROTAGONISTAS DA SEMANA ---
      
      // 1. Buscar TODAS as carnes disponíveis (Proteína + Órgãos)
      const allMainProteins = shuffle(foods.filter(f => 
        (f.category === 'Proteína' || f.category === 'Órgãos') 
        && f.meal_type === 'refeicao_principal'
      ));

      // 2. Identificar itens de LUXO (caros)
      const luxuryItems = ['Salmão', 'Camarão', 'Picanha', 'Bacalhau', 'Costela'];
      const isLuxury = (food: Food) => luxuryItems.some(lux => food.name.includes(lux));

      // 3. Separar carnes em LUXO e NORMAIS
      const luxuryProteins = allMainProteins.filter(isLuxury);
      const normalProteins = allMainProteins.filter(p => !isLuxury(p));

      console.log('🏆 Carnes de LUXO disponíveis:', luxuryProteins.length);
      console.log('🥩 Carnes NORMAIS disponíveis:', normalProteins.length);

      // 4. SORTEAR PROTAGONISTAS DA SEMANA
      let weeklyMainProteins: Food[] = [];

      // Se tiver carnes de luxo, escolher APENAS 1 (máximo)
      if (luxuryProteins.length > 0 && Math.random() > 0.3) { // 70% de chance de incluir luxo
        const selectedLuxury = luxuryProteins[0]; // Pega a primeira (já embaralhada)
        weeklyMainProteins.push(selectedLuxury);
        console.log('✨ LUXO DA SEMANA:', selectedLuxury.name);
      }

      // Completar com 2-3 carnes NORMAIS (total de 3-4 protagonistas)
      const remainingSlots = weeklyMainProteins.length === 1 ? 3 : 4; // Se tem luxo, pega 3 normais. Se não, pega 4.
      const selectedNormals = normalProteins.slice(0, remainingSlots - weeklyMainProteins.length);
      weeklyMainProteins = [...weeklyMainProteins, ...selectedNormals];

      console.log('🍖 PROTAGONISTAS DA SEMANA:', weeklyMainProteins.map(p => p.name).join(', '));
      console.log('📊 Total de protagonistas:', weeklyMainProteins.length);

      // --- FILTROS DE INGREDIENTES (ABSTRATOS - POR FUNÇÃO) ---
      
      // 2. GORDURAS DE PREPARO
      const cookingFats = shuffle(foods.filter(f => 
        f.category === 'Gordura' 
        && f.meal_type === 'preparo'
      ));
      
      // 3. REFORÇO PROTEICO (Snacks Proteicos - Ovos, Queijos, Vísceras, Atum, Sardinha)
      const proteinSnacks = shuffle(foods.filter(f => 
        (f.category === 'Proteína' || f.category === 'Laticínio' || f.category === 'Órgãos' || f.category === 'Gordura')
        && (f.meal_type === 'snack' || f.meal_type === 'cafe_almoco')
      ));
      
      // 4. LATICÍNIOS (Queijos, Requeijão, Iogurte, Kefir)
      const dairyProducts = shuffle(foods.filter(f => 
        f.category === 'Laticínio'
        && f.meal_type !== 'preparo'
      ));
      
      // 5. GORDURAS ESTRATÉGICAS (Abacate, Castanhas, Azeite)
      const strategicFats = shuffle(foods.filter(f => 
        f.category === 'Gordura'
        && f.meal_type !== 'preparo'
      ));

      // 🔥 REGRA 3: CONTROLE DE CUSTO - Castanha do Pará como RARA
      const expensiveItems = ['Castanha do Pará', 'Castanha-do-Pará'];
      let expensiveItemCount = 0;
      const maxExpensivePerWeek = 2;

      // 6. FONTES DE ENERGIA DENSA (Raízes, Tubérculos)
      const energySources = shuffle(foods.filter(f => 
        f.category === 'Carboidrato'
      ));

      // 🔥 REGRA 1: FRUTAS - TODO O BANCO, MÁXIMA VARIEDADE (sem Weekly Pool)
      const allFruits = shuffle(foods.filter(f => 
        f.category === 'Fruta'
        && !['Picles', 'Cebola', 'Alho', 'Limão'].some(term => f.name.includes(term))
      ));

      // 8. VEGETAIS (Fibra e Volume)
      const vegetables = shuffle(foods.filter(f => 
        f.category === 'Vegetais'
      ));

      // 🔥 REGRA 2: PROIBIÇÕES GASTRONÔMICAS
      const fishNames = ['Salmão', 'Tilápia', 'Camarão', 'Peixe', 'Bacalhau', 'Atum', 'Sardinha'];
      const fishReinforcementBan = ['Sardinha', 'Atum'];
      const strongCheeses = ['Parmesão', 'Gorgonzola', 'Roquefort'];
      const wateryFruits = ['Melancia', 'Melão'];

      const isFish = (food: Food) => fishNames.some(fish => food.name.includes(fish));
      const isFishReinforcement = (food: Food) => fishReinforcementBan.some(fish => food.name.includes(fish));
      const isStrongCheese = (food: Food) => strongCheeses.some(cheese => food.name.includes(cheese));
      const isWateryFruit = (food: Food) => wateryFruits.some(fruit => food.name.includes(fruit));

      // 🔥 REGRA 4: MEL É EXTRA, NÃO PRATO (VERSÃO SEGURA)
      const isHoney = (food: Food | undefined | null) => {
        if (!food || !food.name) return false;
        return food.name.toLowerCase().includes('mel');
      };

      // 🎯 NOVA REGRA: OPÇÕES DE CAFÉ DA MANHÃ COM VARIEDADE E BLOQUEIO DE BACON PARA SECAR
      const bfOptionsSecar = [
        { name: 'Ovos com Queijo', desc: 'Proteína + Gordura', category: 'Proteína' },
        { name: 'Omelete de Queijo', desc: 'Saciante e cremoso', category: 'Proteína' },
        { name: 'Café Turbo', desc: 'Café + Manteiga + Óleo de Coco', category: 'Bebida' },
        { name: 'Ovos Cozidos', desc: 'Prático para levar', category: 'Proteína' },
        { name: 'Queijo Coalho Grelhado', desc: 'Proteína rápida', category: 'Laticínio' },
        { name: 'Iogurte Natural com Frutas', desc: 'Leve e nutritivo', category: 'Laticínio' },
        { name: 'Ovos Mexidos Cremosos', desc: 'Feitos na manteiga', category: 'Proteína' }
      ];

      const bfOptionsCrescer = [
        { name: 'Ovos com Bacon', desc: 'Clássico protéico', category: 'Proteína' },
        { name: 'Panquecas de Banana', desc: 'Energia + Sabor', category: 'Carboidrato' },
        { name: 'Ovos com Frutas Doces', desc: 'Proteína + Energia', category: 'Proteína' },
        { name: 'Omelete de Queijo', desc: 'Saciante', category: 'Proteína' },
        { name: 'Café Turbo', desc: 'Café + Manteiga + Óleo de Coco', category: 'Bebida' },
        { name: 'Ovos Cozidos', desc: 'Prático para levar', category: 'Proteína' },
        { name: 'Ovos Mexidos Cremosos', desc: 'Feitos na manteiga', category: 'Proteína' }
      ];

      // Selecionar opções de café baseado no objetivo
      const bfOptions = goal === 'perda' ? bfOptionsSecar : bfOptionsCrescer;
      console.log(`☕ Opções de café da manhã (${goal === 'perda' ? 'SECAR' : 'CRESCER'}):`, bfOptions.length);

      const newWeekPlan: DayPlan[] = [];
      const shoppingMap = new Map<string, string>();

      const addToShop = (food: Food | null | undefined, manualCat?: string) => {
        if (!food) return;
        
        // 🔥 REGRA DE AGRUPAMENTO: Gorduras de Preparo viram item genérico
        if (food.category === 'Gordura' && food.meal_type === 'preparo') {
          shoppingMap.set('Gordura para Cozinhar', 'Gorduras & Óleos');
          return;
        }
        
        let cat = manualCat || food.category;
        if (cat === 'Proteína' || cat === 'Órgãos') cat = 'Açougue (Carnes & Órgãos)';
        if (cat === 'Gordura') cat = 'Gorduras & Óleos';
        if (cat === 'Carboidrato' || cat === 'Fruta' || cat === 'Vegetais') cat = 'Hortifruti (Frutas & Raízes)';
        if (cat === 'Laticínio') cat = 'Laticínios & Ovos';
        shoppingMap.set(food.name, cat);
      };

      // 🎯 NOVA REGRA: Rastreamento de cafés usados (máximo 2x na semana)
      const breakfastUsageCount = new Map<string, number>();

      // 🔥 REGRA 1: Rastreamento de acompanhamentos usados (anti-repetição dia seguido)
      const usedYesterday = {
        fruits: new Set<string>(),
        dairy: new Set<string>(),
        extras: new Set<string>()
      };

      // 🎯 NOVA REGRA: Rastreamento de proteínas usadas (anti-repetição no mesmo dia)
      const usedProteinsToday = new Set<string>();

      for (let i = 0; i < 7; i++) {
        // 🎯 NOVA REGRA: Garantir que almoço e jantar tenham proteínas DIFERENTES
        usedProteinsToday.clear();

        // 🎯 PROTAGONISTAS: Rotacionar entre os 3-4 selecionados
        const meatLunch = weeklyMainProteins[i % weeklyMainProteins.length];
        usedProteinsToday.add(meatLunch.name);

        // Selecionar proteína do jantar (DIFERENTE do almoço)
        const availableForDinner = weeklyMainProteins.filter(p => !usedProteinsToday.has(p.name));
        const meatDinner = availableForDinner[(i + 1) % availableForDinner.length];
        usedProteinsToday.add(meatDinner.name);

        console.log(`🍽️ Dia ${i + 1}: Almoço=${meatLunch.name} | Jantar=${meatDinner.name}`);

        const cookingFat = cookingFats[i % cookingFats.length];

        let lunchSides: Food[] = [];
        let dinnerSides: Food[] = [];
        let lunchDesserts: Food[] = [];
        let dinnerDesserts: Food[] = [];

        // --- ANTI-REPETIÇÃO E ANTI-CLASH ---
        const usedInLunch = new Set<string>();
        const usedInDinner = new Set<string>();
        const dairyCountLunch = { count: 0 };
        const dairyCountDinner = { count: 0 };

        usedInLunch.add(meatLunch.name);
        usedInDinner.add(meatDinner.name);

        const selectUnique = (
          pool: Food[], 
          used: Set<string>, 
          dairyCounter: { count: number },
          count: number = 1,
          mainProtein?: Food
        ): Food[] => {
          const selected: Food[] = [];
          const available = pool.filter(f => {
            if (used.has(f.name)) return false;
            
            // Anti-Clash: Max 1 Laticínio por refeição
            if (f.category === 'Laticínio' && dairyCounter.count >= 1) return false;
            
            // 🔥 REGRA 2: Peixe + Peixe PROIBIDO
            if (mainProtein && isFish(mainProtein) && isFishReinforcement(f)) return false;
            
            // 🔥 REGRA 3: Controle de Castanha do Pará (máx 2x/semana)
            if (expensiveItems.some(exp => f.name.includes(exp)) && expensiveItemCount >= maxExpensivePerWeek) return false;
            
            // 🔥 REGRA 1: Evitar repetição do dia anterior (frutas, queijos, extras)
            if (f.category === 'Fruta' && usedYesterday.fruits.has(f.name)) return false;
            if (f.category === 'Laticínio' && usedYesterday.dairy.has(f.name)) return false;
            if (f.category === 'Gordura' && usedYesterday.extras.has(f.name)) return false;
            
            return true;
          });
          
          for (let j = 0; j < count && j < available.length; j++) {
            const item = available[j];
            selected.push(item);
            used.add(item.name);
            if (item.category === 'Laticínio') dairyCounter.count++;
            
            // 🔥 REGRA 3: Incrementar contador de itens caros
            if (expensiveItems.some(exp => item.name.includes(exp))) expensiveItemCount++;
          }
          
          return selected;
        };

        // 🔥 REGRA 2: Função para evitar Queijo Forte + Fruta Aquosa
        const selectFruitSmart = (
          pool: Food[], 
          used: Set<string>, 
          dairyCounter: { count: number },
          hasStrongCheese: boolean
        ): Food | undefined => {
          const available = pool.filter(f => {
            if (used.has(f.name)) return false;
            if (usedYesterday.fruits.has(f.name)) return false; // Anti-repetição dia seguido
            if (hasStrongCheese && isWateryFruit(f)) return false; // Evitar clash
            return true;
          });
          
          if (available.length === 0) return undefined;
          const selected = available[0];
          used.add(selected.name);
          return selected;
        };

        // --- 🏗️ ARQUITETURA DE SLOTS (ABSTRATA - POR FUNÇÃO) ---
        // 🎯 REGRA 3: LÓGICA VISUAL E DE SACIEDADE
        if (goal === 'ganho') {
          // 🔥 GANHO DE MASSA - PRATOS CARREGADOS (5-6 componentes)
          console.log(`💪 Dia ${i + 1}: Montando pratos CARREGADOS (Hipertrofia)`);
          
          // ALMOÇO: 6 ITENS
          // Slot 1: Proteína Principal (já definida: meatLunch)
          
          // Slot 2: Reforço Proteico (Qualquer Snack Proteico)
          const reforcoProteico = selectUnique(proteinSnacks, usedInLunch, dairyCountLunch, 1, meatLunch)[0];
          
          // Slot 3: Energia Densa (Carboidrato ou Fruta Densa)
          const energiaDensa = selectUnique(
            shuffle([...energySources, ...allFruits.slice(0, 3)]), 
            usedInLunch, 
            dairyCountLunch, 
            1
          )[0];
          
          // Slot 4: Fonte de Gordura (Laticínio ou Gordura Boa)
          const fonteGordura = selectUnique(
            shuffle([...dairyProducts, ...strategicFats]), 
            usedInLunch, 
            dairyCountLunch, 
            1
          )[0];
          
          // 🔥 REGRA 4: Verificar se Mel foi selecionado (COM BLINDAGEM)
          let needsExtraSolid = false;
          if (isHoney(energiaDensa) || isHoney(fonteGordura)) needsExtraSolid = true;
          
          // Slot 5: Fruta A
          const hasStrongCheeseInLunch = reforcoProteico && isStrongCheese(reforcoProteico);
          const frutaA = selectFruitSmart(allFruits, usedInLunch, dairyCountLunch, hasStrongCheeseInLunch);
          
          // Slot 6: Fruta B (Diferente da A)
          const frutaB = selectFruitSmart(allFruits, usedInLunch, dairyCountLunch, hasStrongCheeseInLunch);
          
          // 🔥 REGRA 4: Se Mel foi selecionado, adicionar +1 item sólido
          let extraSolid: Food | undefined;
          if (needsExtraSolid) {
            extraSolid = selectUnique(
              shuffle([...proteinSnacks, ...dairyProducts, ...energySources]), 
              usedInLunch, 
              dairyCountLunch, 
              1,
              meatLunch
            )[0];
          }
          
          lunchSides = [reforcoProteico, energiaDensa, fonteGordura, extraSolid].filter((item): item is Food => !!item);
          lunchDesserts = [frutaA, frutaB].filter((item): item is Food => !!item);

          // JANTAR: 4 ITENS (Compacto)
          // Slot 1: Proteína Principal (já definida: meatDinner)
          
          // Slot 2: Reforço (Snack Proteico ou Laticínio)
          const reforcoJantar = selectUnique(
            shuffle([...proteinSnacks, ...dairyProducts]), 
            usedInDinner, 
            dairyCountDinner,
            1,
            meatDinner
          )[0];
          
          // Slot 3: Extra (Laticínio ou Fruta leve)
          const extraJantar = selectUnique(
            shuffle([...dairyProducts, ...allFruits]), 
            usedInDinner, 
            dairyCountDinner, 
            1
          )[0];
          
          // 🔥 REGRA 4: Verificar se Mel foi selecionado no jantar (COM BLINDAGEM)
          let needsExtraSolidDinner = false;
          if (isHoney(reforcoJantar) || isHoney(extraJantar)) needsExtraSolidDinner = true;
          
          // Slot 4: Fruta (Uma opção leve)
          const hasStrongCheeseInDinner = reforcoJantar && isStrongCheese(reforcoJantar);
          const frutaJantar = selectFruitSmart(allFruits, usedInDinner, dairyCountDinner, hasStrongCheeseInDinner);
          
          // 🔥 REGRA 4: Se Mel foi selecionado, adicionar +1 item sólido
          let extraSolidDinner: Food | undefined;
          if (needsExtraSolidDinner) {
            extraSolidDinner = selectUnique(
              shuffle([...proteinSnacks, ...dairyProducts]), 
              usedInDinner, 
              dairyCountDinner, 
              1,
              meatDinner
            )[0];
          }
          
          dinnerSides = [reforcoJantar, extraJantar, extraSolidDinner].filter((item): item is Food => !!item);
          dinnerDesserts = [frutaJantar].filter((item): item is Food => !!item);

        } else {
          // 💧 PERDA DE PESO - PRATOS LIMPOS (3-4 componentes)
          console.log(`🔥 Dia ${i + 1}: Montando pratos LIMPOS (Cutting)`);
          
          // 🔥 NOVA REGRA: Identificar se proteína principal é Carne Vermelha
          const redMeatNames = ['Mocotó', 'Boi', 'Porco', 'Costela', 'Picanha', 'Fraldinha', 'Cupim'];
          const isRedMeat = (food: Food) => redMeatNames.some(meat => food.name.includes(meat));
          
          // ALMOÇO: 3-4 ITENS (OBRIGATÓRIO: Carne Vermelha ou Ovos para saciedade)
          // Slot 1: Proteína Principal (já definida: meatLunch)
          
          // 🔥 SLOT 2: REFORÇO SAGRADO (HIERARQUIA DE SACIEDADE)
          // Prioridade A: Ovos (Galinha ou Codorna)
          // Prioridade B: Legumes Volumosos (Abóbora, Abobrinha, Chuchu)
          // Prioridade C: Abacate (Gordura que enche)
          // ❌ PROIBIDO: Azeitona, Picles, Queijos sozinhos, Atum/Sardinha se carne vermelha
          
          const eggItems = proteinSnacks.filter(f => 
            f.name.toLowerCase().includes('ovo')
          );
          
          const volumeLegumes = [...vegetables, ...energySources].filter(f => 
            ['Abóbora', 'Abobrinha', 'Chuchu'].some(leg => f.name.includes(leg))
          );
          
          const avocado = strategicFats.filter(f => 
            f.name.toLowerCase().includes('abacate')
          );
          
          // Montar pool de Reforço com hierarquia
          const reforcoPool = shuffle([
            ...eggItems,           // Prioridade A
            ...volumeLegumes,      // Prioridade B
            ...avocado             // Prioridade C
          ]);
          
          // Filtrar proibições: Azeitona, Picles, Atum/Sardinha (se carne vermelha)
          const reforcoSaciedade = selectUnique(
            reforcoPool.filter(f => {
              // Proibir petiscos
              if (['Azeitona', 'Picles'].some(ban => f.name.includes(ban))) return false;
              
              // 🔥 REGRA 2: Proibir Atum/Sardinha se proteína principal for Carne Vermelha
              if (isRedMeat(meatLunch) && isFishReinforcement(f)) return false;
              
              return true;
            }),
            usedInLunch, 
            dairyCountLunch, 
            1, 
            meatLunch
          )[0];
          
          // Slot 3: Fibra ou Volume (Vegetais ou Frutas Low Carb)
          const fibraVolume = selectUnique(
            shuffle([...vegetables, ...allFruits.slice(0, 5)]), 
            usedInLunch, 
            dairyCountLunch, 
            1
          )[0];
          
          // Slot 4: Gordura Estratégica ou Queijo (agora pode entrar como EXTRA, não base)
          const gorduraEstrategica = selectUnique(
            shuffle([...strategicFats, ...dairyProducts]), 
            usedInLunch, 
            dairyCountLunch, 
            1
          )[0];
          
          // 🔥 REGRA 4: Verificar se Mel foi selecionado (COM BLINDAGEM)
          let needsExtraSolid = false;
          if (isHoney(fibraVolume) || isHoney(gorduraEstrategica)) needsExtraSolid = true;
          
          // Slot 5: Toque Final (Fruta Leve ou Digestiva)
          const hasStrongCheeseInLunch = reforcoSaciedade && isStrongCheese(reforcoSaciedade);
          const toqueFinal = selectFruitSmart(allFruits, usedInLunch, dairyCountLunch, hasStrongCheeseInLunch);
          
          // 🔥 REGRA 4: Se Mel foi selecionado, adicionar +1 item sólido
          let extraSolid: Food | undefined;
          if (needsExtraSolid) {
            extraSolid = selectUnique(
              shuffle([...proteinSnacks, ...dairyProducts, ...energySources]), 
              usedInLunch, 
              dairyCountLunch, 
              1,
              meatLunch
            )[0];
          }
          
          lunchSides = [reforcoSaciedade, fibraVolume, gorduraEstrategica, extraSolid].filter((item): item is Food => !!item);
          lunchDesserts = [toqueFinal].filter((item): item is Food => !!item);

          // JANTAR: 3 ITENS (Seco - OBRIGATÓRIO: Carne Vermelha ou Ovos)
          // Slot 1: Proteína Principal (já definida: meatDinner)
          
          // 🔥 SLOT 2: REFORÇO SAGRADO (mesma hierarquia do almoço)
          const reforcoPoolDinner = shuffle([
            ...eggItems,           // Prioridade A
            ...volumeLegumes,      // Prioridade B
            ...avocado             // Prioridade C
          ]);
          
          const reforcoExtra = selectUnique(
            reforcoPoolDinner.filter(f => {
              // Proibir petiscos
              if (['Azeitona', 'Picles'].some(ban => f.name.includes(ban))) return false;
              
              // 🔥 REGRA 2: Proibir Atum/Sardinha se proteína principal for Carne Vermelha
              if (isRedMeat(meatDinner) && isFishReinforcement(f)) return false;
              
              return true;
            }),
            usedInDinner,
            dairyCountDinner,
            1,
            meatDinner
          )[0];
          
          // 🔥 REGRA 4: Verificar se Mel foi selecionado no jantar (COM BLINDAGEM)
          let needsExtraSolidDinner = false;
          if (isHoney(reforcoExtra)) needsExtraSolidDinner = true;
          
          // Slot 3: Fruta (Uma opção leve para fechar)
          const hasStrongCheeseInDinner = reforcoExtra && isStrongCheese(reforcoExtra);
          const fruta = selectFruitSmart(allFruits, usedInDinner, dairyCountDinner, hasStrongCheeseInDinner);
          
          // 🔥 REGRA 4: Se Mel foi selecionado, adicionar +1 item sólido
          let extraSolidDinner: Food | undefined;
          if (needsExtraSolidDinner) {
            extraSolidDinner = selectUnique(
              shuffle([...proteinSnacks, ...dairyProducts]), 
              usedInDinner, 
              dairyCountDinner, 
              1,
              meatDinner
            )[0];
          }
          
          dinnerSides = [reforcoExtra, extraSolidDinner].filter((item): item is Food => !!item);
          dinnerDesserts = [fruta].filter((item): item is Food => !!item);
        }

        // 🔥 REGRA 1: Atualizar rastreamento de acompanhamentos do dia anterior
        usedYesterday.fruits.clear();
        usedYesterday.dairy.clear();
        usedYesterday.extras.clear();
        
        [...lunchSides, ...dinnerSides, ...lunchDesserts, ...dinnerDesserts].forEach(item => {
          if (item.category === 'Fruta') usedYesterday.fruits.add(item.name);
          if (item.category === 'Laticínio') usedYesterday.dairy.add(item.name);
          if (item.category === 'Gordura') usedYesterday.extras.add(item.name);
        });

        // 🎯 NOVA REGRA: Selecionar café da manhã com variedade (máximo 2x na semana)
        let breakfast;
        let attempts = 0;
        const maxAttempts = bfOptions.length * 2; // Evitar loop infinito
        
        do {
          const randomIndex = Math.floor(Math.random() * bfOptions.length);
          breakfast = bfOptions[randomIndex];
          const currentCount = breakfastUsageCount.get(breakfast.name) || 0;
          
          if (currentCount < 2) {
            breakfastUsageCount.set(breakfast.name, currentCount + 1);
            break;
          }
          
          attempts++;
        } while (attempts < maxAttempts);
        
        // Fallback: se todos foram usados 2x, resetar contador e escolher aleatório
        if (attempts >= maxAttempts) {
          breakfastUsageCount.clear();
          breakfast = bfOptions[Math.floor(Math.random() * bfOptions.length)];
          breakfastUsageCount.set(breakfast.name, 1);
        }

        console.log(`☕ Dia ${i + 1}: ${breakfast.name} (Uso: ${breakfastUsageCount.get(breakfast.name)}x)`);

        // Montar Lista de Compras
        addToShop(meatLunch);
        addToShop(meatDinner);
        addToShop(cookingFat);
        lunchSides.forEach(s => addToShop(s));
        dinnerSides.forEach(s => addToShop(s));
        lunchDesserts.forEach(d => addToShop(d, 'Hortifruti (Frutas & Raízes)'));
        dinnerDesserts.forEach(d => addToShop(d, 'Hortifruti (Frutas & Raízes)'));
        
        // Itens de Café Específicos
        if (breakfast.name.includes('Ovos')) {
          const eggs = foods.find(f => f.name.toLowerCase().includes('ovo'));
          addToShop(eggs, 'Laticínios & Ovos');
        }
        if (breakfast.name.includes('Bacon')) {
          const bacon = foods.find(f => f.name.includes('Bacon'));
          addToShop(bacon, 'Açougue (Carnes & Órgãos)');
        }
        if (breakfast.name.includes('Queijo')) {
          const cheese = foods.find(f => f.name.includes('Queijo'));
          addToShop(cheese, 'Laticínios & Ovos');
        }
        if (breakfast.name.includes('Manteiga')) {
          const butter = foods.find(f => f.name.includes('Manteiga'));
          addToShop(butter, 'Laticínios & Ovos');
        }
        if (breakfast.name.includes('Banana')) {
          const banana = foods.find(f => f.name.includes('Banana'));
          addToShop(banana, 'Hortifruti (Frutas & Raízes)');
        }
        if (breakfast.name.includes('Iogurte')) {
          const yogurt = foods.find(f => f.name.includes('Iogurte'))
          addToShop(yogurt, 'Laticínios & Ovos');
        }

        newWeekPlan.push({
          day: `Dia ${i + 1}`,
          breakfast,
          lunch: { main: meatLunch, fat: cookingFat, sides: lunchSides, desserts: lunchDesserts },
          dinner: { main: meatDinner, fat: cookingFat, sides: dinnerSides, desserts: dinnerDesserts }
        });
      }

      shoppingMap.set('Café', 'Despensa & Outros');
      shoppingMap.set('Sal', 'Despensa & Outros');
      shoppingMap.set('Óleo de Coco', 'Gorduras & Óleos');

      const newShoppingList: ShoppingItem[] = Array.from(shoppingMap.entries())
        .map(([name, category]) => ({ name, category, checked: false }))
        .sort((a, b) => a.category.localeCompare(b.category));

      const { error } = await supabase
        .from('meal_plans')
        .upsert({
          user_id: user.id,
          week_plan: newWeekPlan,
          shopping_list: newShoppingList,
          goal_type: goal,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setMenu(newWeekPlan);
      setShoppingList(newShoppingList);
      setActiveDay(0);

      console.log('✅ Cardápio gerado com sucesso!');
      console.log('📊 Estatísticas de Variedade:');
      console.log('  - Cafés da manhã únicos:', breakfastUsageCount.size);
      console.log('  - Proteínas principais (Protagonistas):', weeklyMainProteins.length);
      console.log('  - Lista:', weeklyMainProteins.map(p => p.name).join(', '));

    } catch (err) {
      console.error('Erro na geração:', err);
      alert('Erro ao gerar cardápio.');
    } finally {
      setLoading(false);
    }
  };

  // --- 4. CHECKLIST E UI ---
  const toggleCheck = async (index: number) => {
    if (!user) return;
    const newList = [...shoppingList];
    newList[index].checked = !newList[index].checked;
    setShoppingList(newList);

    await supabase.from('meal_plans').update({ shopping_list: newList }).eq('user_id', user.id);
  };

  const renderShoppingGroup = (title: string, icon: React.ReactNode, categoryFilter: string) => {
    const items = shoppingList.filter(i => i.category.includes(categoryFilter) || categoryFilter.includes(i.category));
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-4 last:mb-0">
            <h4 className="text-zinc-400 text-xs font-bold uppercase mb-2 flex items-center gap-2 pl-1 border-b border-zinc-800 pb-1">
                {icon} {title}
            </h4>
            <div className="grid grid-cols-1 gap-2">
                {items.map((item, idx) => (
                    <div key={`${title}-${idx}`} onClick={() => toggleCheck(shoppingList.indexOf(item))} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${item.checked ? 'bg-green-900/10 border-green-900/30 opacity-60' : 'bg-zinc-950 border-zinc-800 hover:border-amber-500/50'}`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>
                            {item.checked && <Check size={14} className="text-black font-bold" />}
                        </div>
                        <span className={`text-sm ${item.checked ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  // Função para lidar com clique no botão de gerar novo cardápio
  const handleGenerateClick = () => {
    if (!isSubscriber) {
      setShowPaywall(true);
    } else {
      setShowResetModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center animate-pulse">
          <Utensils className="w-10 h-10 mx-auto text-amber-500 mb-4" />
          <p className="text-zinc-400">Consultando o Nutricionista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 pb-28 font-sans">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-amber-500 flex items-center gap-2"><Utensils /> Nutricionista</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Plano Inteligente: {userGoal.includes('ganho') ? 'Ganho de Massa 💪' : 'Queima de Gordura 🔥'}
        </p>
      </header>

      {menu.length > 0 && (
        <>
          <button 
            onClick={handleGenerateClick}
            disabled={loading} 
            className={`w-full border p-4 rounded-xl mb-6 shadow-lg active:scale-95 flex justify-center items-center gap-2 transition-all ${
              isSubscriber 
                ? 'bg-zinc-900 border-amber-500/30 text-amber-500 font-bold hover:bg-zinc-800' 
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {isSubscriber ? (
              <>
                <Sparkles size={20} /> Gerar Novo Cardápio
              </>
            ) : (
              <>
                <Lock size={20} /> Gerar Novo Cardápio (Premium)
              </>
            )}
          </button>

          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Seletor de Dias */}
            <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
              {menu.map((day, idx) => {
                // PAYWALL: Apenas segunda-feira visível para não-assinantes
                const isLocked = !isSubscriber && idx > 0;
                
                return (
                  <button 
                    key={idx} 
                    onClick={() => !isLocked && setActiveDay(idx)} 
                    disabled={isLocked}
                    className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all relative ${
                      isLocked 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                        : activeDay === idx 
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                          : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isLocked && <Lock size={12} className="inline mr-1" />}
                    {day.day}
                  </button>
                );
              })}
            </div>
            
            {/* CARDS DE REFEIÇÃO */}
            <div className={`bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-8 shadow-xl relative ${!isSubscriber && activeDay > 0 ? 'blur-sm pointer-events-none' : ''}`}>
              {/* Café */}
              <div>
                <h3 className="text-amber-500 font-bold mb-2 flex items-center gap-2 text-lg"><Coffee size={18}/> Café da Manhã</h3>
                <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                  <span className="font-bold block text-lg">{menu[activeDay].breakfast.name}</span> 
                  <span className="text-xs text-zinc-500">{menu[activeDay].breakfast.desc}</span>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* Almoço */}
              <div>
                <h3 className="text-amber-500 font-bold mb-3 flex items-center gap-2 text-lg"><Utensils size={18}/> Almoço (Pré-Treino)</h3>
                <div className="space-y-3">
                  <div className="bg-zinc-950 p-4 rounded-xl border-l-4 border-l-amber-500 border border-zinc-800">
                      <span className="text-xl font-bold block">{menu[activeDay].lunch.main.name}</span> 
                      <span className="text-xs text-zinc-500 italic flex items-center gap-1 mt-1">
                        <Flame size={12} /> Preparado com {menu[activeDay].lunch.fat?.name}
                      </span>
                  </div>
                  <div>
                      <span className="text-xs text-zinc-500 uppercase mb-2 block pl-1 font-bold">Acompanhamentos & Energia</span>
                      <div className="space-y-2">
                          {[...menu[activeDay].lunch.sides, ...menu[activeDay].lunch.desserts].map((item, i) => (
                              <div key={`l-side-${i}`} className="flex items-center gap-2 text-sm text-zinc-200">
                                  <Circle size={8} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                                  <span>{item.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* Jantar */}
              <div>
                <h3 className="text-amber-500 font-bold mb-3 flex items-center gap-2 text-lg"><Utensils size={18}/> Jantar (Recuperação)</h3>
                <div className="space-y-3">
                  <div className="bg-zinc-950 p-4 rounded-xl border-l-4 border-l-amber-500 border border-zinc-800">
                      <span className="text-xl font-bold block">{menu[activeDay].dinner.main.name}</span> 
                      <span className="text-xs text-zinc-500 italic flex items-center gap-1 mt-1">
                        <Flame size={12} /> Preparado com {menu[activeDay].dinner.fat?.name}
                      </span>
                  </div>
                  <div>
                      <span className="text-xs text-zinc-500 uppercase mb-2 block pl-1 font-bold">Acompanhamentos & Energia</span>
                      <div className="space-y-2">
                          {[...menu[activeDay].dinner.sides, ...menu[activeDay].dinner.desserts].map((item, i) => (
                              <div key={`d-side-${i}`} className="flex items-center gap-2 text-sm text-zinc-200">
                                  <Circle size={8} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                                  <span>{item.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>
                </div>
              </div>

              {/* Overlay de Blur para dias bloqueados */}
              {!isSubscriber && activeDay > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform"
                  >
                    <Lock size={18} className="inline mr-2" />
                    Desbloquear Semana Completa
                  </button>
                </div>
              )}
            </div>

            {/* Lista de Compras */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mt-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-green-400">
                      <ShoppingCart /> Lista de Compras
                  </h3>
                  <span className="text-zinc-500 font-mono text-sm bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg">
                      {shoppingList.filter(i => i.checked).length}/{shoppingList.length}
                  </span>
              </div>
              
              {renderShoppingGroup('Açougue', <Beef size={16}/>, 'Açougue (Carnes & Órgãos)')}
              {renderShoppingGroup('Hortifruti', <Carrot size={16}/>, 'Hortifruti (Frutas & Raízes)')}
              {renderShoppingGroup('Ovos & Laticínios', <Milk size={16}/>, 'Laticínios & Ovos')}
              {renderShoppingGroup('Gorduras', <Droplets size={16}/>, 'Gorduras & Óleos')}
              {renderShoppingGroup('Despensa', <Package size={16}/>, 'Despensa & Outros')}
              
              {shoppingList.filter(i => i.checked).length > 0 && (
                  <button 
                    onClick={async () => {
                        const cleared = shoppingList.map(i => ({...i, checked: false}));
                        setShoppingList(cleared);
                        await supabase.from('meal_plans').update({ shopping_list: cleared }).eq('user_id', user.id);
                    }}
                    className="w-full mt-8 p-4 rounded-xl border border-red-900/30 bg-red-900/10 text-red-400 flex items-center justify-center gap-2 hover:bg-red-900/20 transition-all text-sm font-bold"
                  >
                      <Trash2 size={18} /> Limpar Marcações
                  </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de Confirmação */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Gerar Novo Cardápio?</h3>
            <p className="text-zinc-400 mb-6 text-sm">
              Isso vai apagar a lista atual e gerar uma nova combinação focada em: <br/>
              <strong className="text-amber-500 text-lg uppercase">{userGoal.includes('ganho') ? 'Ganho de Massa' : 'Queima de Gordura'}</strong>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetModal(false)} 
                className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3 px-4 rounded-xl hover:bg-zinc-700 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { setShowResetModal(false); generateAndSaveMenu(userGoal); }} 
                className="flex-1 bg-amber-600 text-black font-bold py-3 px-4 rounded-xl hover:bg-amber-500 transition-all"
              >
                Sim, Gerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Paywall */}
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />
    </div>
  );
}
