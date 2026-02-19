'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';
import { 
  ShoppingCart, Utensils, Check, Flame, 
  Coffee, Droplets, Beef, Carrot, 
  Milk, Package, Trash2, Sparkles, Circle, Lock 
} from 'lucide-react';

// --- TIPAGENS MANUAIS (Para evitar erro de banco desatualizado) ---
interface Food {
  id: number;
  name: string;
  category: string;
  goal_tag: string;
  meal_type?: string;
  status?: string;
  tier?: 'daily' | 'rotation' | 'luxury'; // O código agora sabe que isso existe
}

interface Meal {
  main: Food;
  fat: Food | null;
  sides: Food[];
  desserts: Food[];
}

interface DayPlan {
  day: string;
  breakfast: {
    name: string;
    desc: string;
    category: string;
    sides: Food[];
  };
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', user.id)
          .single();
        
        // Verificar status de assinante
        setIsSubscriber(profile?.is_subscriber || false);

        // Mapeamento de Objetivo
        const raw = (profile?.goal || profile?.goal_type || '').toLowerCase();
        const currentGoal = (
          raw.includes('ganho') || 
          raw.includes('massa') || 
          raw.includes('hipertrofia') || 
          raw.includes('crescer')
        ) ? 'ganho' : 'perda';
        
        setUserGoal(currentGoal);

        const { data: existingPlan } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingPlan && existingPlan.goal_type !== currentGoal) {
          await supabase.from('meal_plans').delete().eq('id', existingPlan.id);
          await generateAndSaveMenu(currentGoal);
          return;
        }

        if (existingPlan) {
          const parsedWeek = typeof existingPlan.week_plan === 'string' ? JSON.parse(existingPlan.week_plan) : existingPlan.week_plan;
          const parsedList = typeof existingPlan.shopping_list === 'string' ? JSON.parse(existingPlan.shopping_list) : existingPlan.shopping_list;
          // Compatibilidade: planos antigos podem não ter breakfast.sides
          const week = (parsedWeek || []).map((day: DayPlan) => ({
            ...day,
            breakfast: { ...day.breakfast, sides: day.breakfast?.sides ?? [] }
          }));
          setMenu(week);
          setShoppingList(parsedList || []);
        } else {
          await generateAndSaveMenu(currentGoal);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

// --- 3. GERAÇÃO INTELIGENTE (CÉREBRO 23.0 - OTIMIZAÇÃO DE COMPRAS) ---
const generateAndSaveMenu = async (goal: string) => {
  if (!user) return;
  setLoading(true);

  try {
    // 1. BUSCAR ALIMENTOS
    const { data: rawFoods, error } = await supabase
      .from('foods')
      .select('*')
      .neq('status', 'banned');

    if (error || !rawFoods || rawFoods.length === 0) throw new Error('Erro ao buscar alimentos.');
    
    const allFoods = (rawFoods as unknown as Food[]);

// --- FILTROS & LISTA NEGRA GERAL ---
const globalBlacklist = [
  'limão', 'água', 'gelo', 'sal', 'vinagre', 'tempero', 'pimenta', 'maracujá', 'chimarrão', 'chá',
  'cenoura', 'beterraba', 'tomate', 'pepino', 'azeitona', 'alface', 'rúcula', 'agrião', 'cebola', 'pimentão'
];

// --- TRAVA CALÓRICA (PERDA DE GORDURA) ---
// Identifica se a meta é emagrecimento
const isFatLoss = goal.toLowerCase().includes('perda') || goal.toLowerCase().includes('emagrecimento');

// Bombas calóricas (Gordura + Carbo Denso) que serão banidas apenas no cutting
const fatLossBlacklist = [
  // Carnes Gordas e Embutidos
  'bacon', 'torresmo', 'barriga', 'panceta', 'costela', 'cupim', 
  // Queijos Pesados
  'parmesão', 'mussarela', 'prato', 'amarelo', 'curado', 'provolone',
  // Frutas Ultra-Densas e Doces (Açúcar/Caloria Alta)
  'tâmara', 'coco seco', 'banana da terra', 'manga', 'caqui', 'uva'
];

const primalFoods = allFoods.filter(f => {
 const n = f.name.toLowerCase();
 // 1. Remove Grãos e Processados (Sempre)
 if (n.includes('arroz') || n.includes('feijão') || n.includes('macarrão') || n.includes('pão') || n.includes('trigo') || n.includes('aveia') || n.includes('soja') || n.includes('biscoito')) return false;
 
 // 2. Remove Lista Negra Geral (Temperos e Vegetais fracos)
 if (globalBlacklist.some(b => n.includes(b))) return false;
 
 // 3. SE FOR PERDA DE GORDURA: Remove as bombas calóricas
 if (isFatLoss && fatLossBlacklist.some(b => n.includes(b))) return false;

 return true;
});

    // --- BUCKETS (CESTAS DE ALIMENTOS) ---

    // 1. CARNES PRINCIPAIS
    const bucketMainMeats = primalFoods.filter(f => {
        const n = f.name.toLowerCase();
        const isMeat = f.category === 'Proteína' || f.category === 'Órgãos';
        const isSideOrSnack = n.includes('bacon') || n.includes('torresmo') || n.includes('linguiça') || n.includes('salsicha') || n.includes('ovo') || n.includes('queijo') || n.includes('presunto') || n.includes('atum') || n.includes('sardinha') || n.includes('mocotó');
        return isMeat && !isSideOrSnack;
    });

    // 2. CAFÉ DA MANHÃ (Principal)
    const bucketBreakfastMain = primalFoods.filter(f => {
        const n = f.name.toLowerCase();
        const validCategories = (f.category === 'Proteína' || f.category === 'Laticínio');
        const isBreakfastItem = n.includes('ovo') || n.includes('queijo') || n.includes('iogurte') || n.includes('coalho') || n.includes('ricota') || n.includes('cottage') || n.includes('presunto') || n.includes('bacon');
        const isLunchMeat = bucketMainMeats.some(m => m.name === f.name);
        return validCategories && isBreakfastItem && !isLunchMeat && !n.includes('torresmo');
    });

    // 3. ACOMPANHAMENTOS
    const bucketCoffee = primalFoods.filter(f => f.name.toLowerCase().includes('café') || f.name.toLowerCase().includes('turbo'));
    
    const bucketBreakfastFruits = primalFoods.filter(f => {
        const n = f.name.toLowerCase();
        const isFruit = f.category === 'Fruta';
        const isCarbo = n.includes('panqueca') || n.includes('tapioca') || n.includes('banana');
        const isLunchVeg = f.category === 'Vegetais' || f.category === 'Carboidrato'; 
        return (isFruit || isCarbo) && !isLunchVeg;
    });

    const bucketSideProtein = primalFoods.filter(f => {
        const n = f.name.toLowerCase();
        return (f.category === 'Proteína' || f.category === 'Laticínio') && 
               (n.includes('ovo') || n.includes('queijo') || n.includes('bacon') || n.includes('torresmo') || n.includes('linguiça'));
    });

    const bucketSideRoots = primalFoods.filter(f => {
        const n = f.name.toLowerCase();
        const isRootOrVeg = f.category === 'Carboidrato' || f.category === 'Vegetais';
        const allowedRoots = n.includes('mandioca') || n.includes('aipim') || n.includes('batata') || n.includes('abóbora') || n.includes('jerimum') || n.includes('inhame') || n.includes('cará') || n.includes('abobrinha');
        return isRootOrVeg && allowedRoots && f.category !== 'Fruta';
    });

    const bucketSideFruits = primalFoods.filter(f => f.category === 'Fruta' && !f.name.toLowerCase().includes('abacate') && !f.name.toLowerCase().includes('coco'));
    const bucketSideFats = primalFoods.filter(f => f.name.toLowerCase().includes('abacate') || f.name.toLowerCase().includes('coco'));

    const bucketHoney = primalFoods.filter(f => {
        const n = f.name.toLowerCase();
        return (n === 'mel' || n === 'mel cru' || n === 'mel de abelha' || n.startsWith('mel ')) && !n.includes('melão') && !n.includes('melancia');
    });
    
    const bucketCookingFats = primalFoods.filter(f => {
        const n = f.name.toLowerCase();
        return f.category === 'Gordura' && (n.includes('manteiga') || n.includes('banha') || n.includes('sebo') || n.includes('azeite') || n.includes('coco') || n.includes('ghee'));
    });

    // --- LÓGICA DE BARALHO ---
    const createDeck = (bucket: Food[], minSize: number) => {
        let deck = [...bucket].sort(() => Math.random() - 0.5);
        while (deck.length < minSize) {
            deck = [...deck, ...bucket.sort(() => Math.random() - 0.5)];
        }
        return deck;
    };

    // --- OTIMIZAÇÃO DE COMPRAS (REGRA DE 4 CARNES) ---
    // Seleciona 4 carnes aleatórias para serem as ÚNICAS da semana
    const weeklyMeatPool = [...bucketMainMeats].sort(() => Math.random() - 0.5).slice(0, 4);
    
    // Cria um deck de 14 refeições usando APENAS essas 4 carnes
    let meatDeck: Food[] = [];
    while (meatDeck.length < 14) {
        meatDeck = [...meatDeck, ...weeklyMeatPool];
    }
    meatDeck = meatDeck.sort(() => Math.random() - 0.5).slice(0, 14);

    // Baralhos de Acompanhamentos
    const deckBreakfastMains = createDeck(bucketBreakfastMain, 7);
    const deckSideProteins = createDeck(bucketSideProtein, 14);
    const deckRoots = createDeck(bucketSideRoots, 14);
    const deckFruits = createDeck(bucketSideFruits, 20);
    
    const newWeekPlan: DayPlan[] = [];
    const shoppingMap = new Map<string, string>();

    const addToShop = (food: Food | null | undefined) => {
      if (!food) return;
      let cleanName = food.name;
      const n = cleanName.toLowerCase();

      if (n.includes('ovo') || n.includes('omelete')) cleanName = 'Ovos (Cartela/Dúzia)';
      else if (n.includes('queijo') || n.includes('requeijão') || n.includes('coalho')) cleanName = 'Queijos Variados';
      else if (n.includes('bacon') || n.includes('torresmo') || n.includes('barriga')) cleanName = 'Bacon & Torresmo';
      else if (n.includes('manteiga')) cleanName = 'Manteiga';
      else if (n.includes('sebo') || n.includes('banha')) cleanName = 'Gordura (Banha/Sebo)';
      // CORREÇÃO AQUI: Exigir a palavra exata para não confundir com Melão/Melancia
      else if (n === 'mel' || n === 'mel cru' || n === 'mel de abelha' || n.startsWith('mel ')) cleanName = 'Mel de Abelha';

      let cat = food.category;
      if (cleanName.includes('Ovos') || cleanName.includes('Queijos')) cat = 'Laticínios & Ovos';
      else if (weeklyMeatPool.some(m => m.name === food.name)) cat = 'Açougue (Carnes & Órgãos)'; 
      else if (cat === 'Gordura') cat = 'Gorduras & Óleos';
      else cat = 'Hortifruti (Frutas & Raízes)';

      shoppingMap.set(cleanName, cat);
    };

    const drawCard = (deck: Food[], exclude: (Food|undefined)[] = []) => {
       const validExcludes = exclude.filter(e => e !== undefined);
       const index = deck.findIndex(item => !validExcludes.some(e => e?.name === item.name));
       if (index !== -1) return deck.splice(index, 1)[0];
       return deck.shift();
    };

    for (let i = 1; i <= 7; i++) {
      const cookingFat = bucketCookingFats[i % bucketCookingFats.length] || { id:0, name:'Manteiga', category:'Gordura', goal_tag:'ambos' };
      
      // 1. CAFÉ DA MANHÃ
      const breakfastMain = deckBreakfastMains.shift() || { id:0, name:'Ovos Mexidos', category:'Proteína', goal_tag:'ambos' };
      
      let breakfastSide;
      if (Math.random() > 0.5 && bucketCoffee.length > 0) {
           breakfastSide = bucketCoffee[Math.floor(Math.random() * bucketCoffee.length)];
      } else {
           breakfastSide = bucketBreakfastFruits[Math.floor(Math.random() * bucketBreakfastFruits.length)];
      }

      // Seleção de Carnes
      let dailyMeatLunch = meatDeck.pop();
      let dailyMeatDinner = meatDeck.pop();
      
      if (dailyMeatLunch?.name === dailyMeatDinner?.name && meatDeck.length > 0) {
          meatDeck.unshift(dailyMeatDinner!);
          dailyMeatDinner = meatDeck.pop();
      }

      // === 2. ALMOÇO (Lógica Adaptável: Ganho vs Perda) ===
      const lunchSides: Food[] = [];
      const lunchDesserts: Food[] = [];
      
      // Side 1: Proteína (Sempre)
      const lSide1 = drawCard(deckSideProteins, [breakfastMain]);
      if(lSide1) lunchSides.push(lSide1);

      // Side 2: Raiz (Sempre - Energia Base)
      const lSide2 = drawCard(deckRoots, lunchSides);
      if(lSide2) lunchSides.push(lSide2);

      // Side 3: Fruta 1 (Sempre)
      const lSide3 = drawCard(deckFruits, lunchSides);
      if(lSide3) lunchSides.push(lSide3);

      // Side 4: Fruta 2 (SÓ NO GANHO)
      if (goal === 'ganho') {
           const lSide4 = drawCard(deckFruits, lunchSides);
           if(lSide4) lunchSides.push(lSide4);
      }
      
      // Mel (SÓ NO GANHO)
      if (goal === 'ganho' && Math.random() > 0.4) {
           const honey = bucketHoney.length > 0 ? bucketHoney[0] : null;
           if(honey) lunchDesserts.push(honey);
      }

      // === 3. JANTAR (Lógica Adaptável) ===
      const dinnerSides: Food[] = [];
      const dinnerDesserts: Food[] = [];
      const dayExcludes = [...lunchSides, breakfastMain];

      const lunchHadCheese = lunchSides.some(f => f.name.toLowerCase().includes('queijo') || f.name.toLowerCase().includes('coalho'));
      
      // Side 1: Proteína (Anti-repetição)
      let dSide1;
      if (lunchHadCheese) {
          const idx = deckSideProteins.findIndex(f => !f.name.toLowerCase().includes('queijo'));
          if (idx !== -1) dSide1 = deckSideProteins.splice(idx, 1)[0];
          else dSide1 = deckSideProteins.shift();
      } else {
          dSide1 = deckSideProteins.shift();
      }
      if(dSide1) dinnerSides.push(dSide1);

      // Side 2: Energia (Raiz ou Fruta)
      const randType = Math.random();
      let dSide2;
      if (randType < 0.4) dSide2 = drawCard(deckRoots, [...dayExcludes, ...dinnerSides]);
      else if (randType < 0.8) dSide2 = drawCard(deckFruits, [...dayExcludes, ...dinnerSides]);
      else dSide2 = bucketSideFats[Math.floor(Math.random() * bucketSideFats.length)];
      
      if(dSide2) dinnerSides.push(dSide2);

      // Side 3: Fruta Extra (SÓ NO GANHO)
      // Na perda, o jantar fica com apenas 3 itens (Carne + Prot + Energia)
      if (goal === 'ganho') {
           const dSide3 = drawCard(deckFruits, [...dayExcludes, ...dinnerSides]);
           if(dSide3) dinnerSides.push(dSide3);
      }

      // Mel (SÓ NO GANHO)
      if (goal === 'ganho' && Math.random() > 0.5) {
           const honey = bucketHoney.length > 0 ? bucketHoney[0] : null;
           if(honey) dinnerDesserts.push(honey);
      }

      addToShop(breakfastMain);
      addToShop(breakfastSide);
      addToShop(dailyMeatLunch);
      addToShop(dailyMeatDinner);
      addToShop(cookingFat);
      lunchSides.forEach(addToShop);
      lunchDesserts.forEach(addToShop);
      dinnerSides.forEach(addToShop);
      dinnerDesserts.forEach(addToShop);

      newWeekPlan.push({
        day: `Dia ${i}`,
        breakfast: {
          name: breakfastMain.name,
          category: breakfastMain.category,
          desc: 'Desjejum Primal',
          sides: breakfastSide ? [breakfastSide] : []
        },
        lunch: {
          main: dailyMeatLunch || {id:0, name:'Carne Bovina', category:'Proteína', goal_tag:'ambos'},
          fat: cookingFat,
          sides: lunchSides,
          desserts: lunchDesserts
        },
        dinner: {
          main: dailyMeatDinner || {id:0, name:'Peixe/Frango', category:'Proteína', goal_tag:'ambos'},
          fat: cookingFat,
          sides: dinnerSides,
          desserts: dinnerDesserts
        }
      });
    }

    if (!shoppingMap.has('Sal')) shoppingMap.set('Sal', 'Despensa & Outros');
    if (!shoppingMap.has('Café')) shoppingMap.set('Café', 'Despensa & Outros');

    const newShoppingList = Array.from(shoppingMap.entries())
      .map(([name, category]) => ({ name, category, checked: false }))
      .sort((a, b) => a.category.localeCompare(b.category));

    await supabase.from('meal_plans').upsert({
      user_id: user.id,
      week_plan: newWeekPlan,
      shopping_list: newShoppingList,
      goal_type: goal,
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    setMenu(newWeekPlan);
    setShoppingList(newShoppingList);
    console.log('✅ Cardápio 23.0 (Compras Otimizadas) Gerado!');

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
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden">
      <div className="flex-1 p-4 pb-44">
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
                  const isLocked = !isSubscriber && idx > 2;
                  return (
                    <button 
                      key={idx} 
                      onClick={() => {
                        if (isLocked) {
                          setShowPaywall(true);
                        } else {
                          setActiveDay(idx);
                        }
                      }} 
                      className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all relative ${
                        isLocked 
                          ? 'bg-zinc-800 text-zinc-500 hover:text-amber-500 hover:bg-zinc-800/80 cursor-pointer' 
                          : activeDay === idx 
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {isLocked && <Lock size={12} className="inline mr-1 mb-0.5" />}
                      {day.day}
                    </button>
                  );
                })}
              </div>
              
              {/* CARDS DE REFEIÇÃO */}
              <div className={`bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-8 shadow-xl relative ${!isSubscriber && activeDay > 2 ? 'blur-sm pointer-events-none' : ''}`}>
                
                {/* Café da Manhã */}
                <div>
                  <h3 className="text-amber-500 font-bold mb-3 flex items-center gap-2 text-lg"><Coffee size={18}/> Café da Manhã</h3>
                  <div className="space-y-3">
                    <div className="bg-zinc-950/50 p-4 rounded-xl border-l-4 border-l-amber-500 border border-zinc-800/50">
                      <span className="text-xl font-bold block">{menu[activeDay].breakfast.name}</span>
                      <span className="text-xs text-zinc-500">{menu[activeDay].breakfast.desc}</span>
                    </div>
                    {(menu[activeDay].breakfast.sides?.length ?? 0) > 0 && (
                      <div>
                        <span className="text-xs text-zinc-500 uppercase mb-2 block pl-1 font-bold">Acompanhamentos</span>
                        <div className="space-y-2">
                          {(menu[activeDay].breakfast.sides || []).map((item, i) => (
                            <div key={`b-side-${i}`} className="flex items-center gap-2 text-sm text-zinc-200">
                              <Circle size={8} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                              <span>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

                {!isSubscriber && activeDay > 2 && (
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

        <PaywallModal 
          isOpen={showPaywall} 
          onClose={() => setShowPaywall(false)} 
          userId={user?.id || ''} 
        />
      </div> 
    </div>
  );
}