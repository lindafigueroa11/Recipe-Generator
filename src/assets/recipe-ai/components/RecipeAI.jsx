import React, { useState } from "react";
import { ChefHat, Heart, Clock, Users, BarChart3, Sparkles, Lock, Leaf, Zap, ShoppingBasket, UserRound } from "lucide-react";

const quickIngredients = ["🍗 Pollo", "🍝 Pasta", "🥚 Huevo", "🧀 Queso", "🍅 Tomate"];

export default function RecipeAI() {
  const [ingredients, setIngredients] = useState("");

  const addIngredient = (item) => {
    const clean = item.replace(/^[^\wáéíóúñ]+\s?/i, "");
    setIngredients((prev) => prev ? `${prev}, ${clean}` : clean);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_15%,rgba(251,146,60,.18),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(254,215,170,.42),transparent_28%),linear-gradient(135deg,#fff7ed_0%,#fffbeb_48%,#fff7ed_100%)] px-6 py-6 text-[#431407]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-white/70 bg-white/60 px-7 py-4 shadow-[0_18px_60px_rgba(120,53,15,.09)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-100 text-orange-600"><ChefHat /></div>
          <span className="font-serif text-2xl font-bold tracking-wide">Recipe AI</span>
        </div>
        <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
          <span className="rounded-full bg-orange-100 px-5 py-2 text-orange-600">Inicio</span>
          <span>Mis recetas</span>
          <span className="flex items-center gap-2"><Heart size={18}/> Favoritos</span>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-orange-50 px-4 py-2 font-semibold"><UserRound size={18}/> María</div>
      </nav>

      <section className="mx-auto max-w-7xl py-10 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-5 py-2 text-sm font-bold shadow-sm">
          <Sparkles size={16} className="text-orange-500"/> Powered by AI
        </div>
        <h1 className="mx-auto max-w-4xl font-serif text-5xl font-black leading-[.95] md:text-7xl">
          Cocina inteligente <br />
          <em className="font-serif text-orange-600">con lo que ya tienes</em>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#74513f]">
          Escribe tus ingredientes y recibe al instante una receta personalizada creada por nuestra IA.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.82fr_1.18fr]">
        <article className="rounded-[28px] border border-white/70 bg-white/70 p-7 shadow-[0_24px_60px_rgba(120,53,15,.12)] backdrop-blur-xl">
          <h2 className="flex items-center gap-3 font-serif text-2xl font-bold"><span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-600">🥣</span> 1. Cuéntanos qué tienes</h2>
          <label className="mt-7 block text-left font-medium text-[#5c3b2c]">Escribe los ingredientes que tienes en casa</label>
          <div className="relative mt-3">
            <textarea value={ingredients} onChange={(e)=>setIngredients(e.target.value)} placeholder="Ejemplo: aguacate, tomate, cebolla" className="min-h-28 w-full resize-none rounded-2xl border border-orange-200 bg-white/80 p-5 pr-12 text-base outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            <Leaf className="absolute bottom-5 right-5 text-green-500" size={18}/>
          </div>
          <p className="mt-6 text-left text-sm text-[#74513f]">O elige algunos ingredientes rápidos:</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {quickIngredients.map(item => <button key={item} onClick={() => addIngredient(item)} className="rounded-2xl border border-orange-100 bg-white/75 px-4 py-3 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-white">{item}</button>)}
          </div>
          <button className="mt-7 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-5 text-lg font-extrabold text-white shadow-[0_14px_32px_rgba(234,88,12,.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(234,88,12,.36)]">Generar receta →</button>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-[#74513f]"><Lock size={14}/> 100% privado. Solo tú ves tus recetas.</p>
        </article>

        <article className="rounded-[28px] border border-white/70 bg-white/70 p-7 shadow-[0_24px_60px_rgba(120,53,15,.12)] backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold"><Sparkles className="text-orange-500"/> Tu receta personalizada</h2>
            <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700">● Generada por AI</span>
          </div>
          <div className="grid gap-6 md:grid-cols-[.82fr_1.18fr]">
            <div className="h-44 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 p-5 text-left shadow-inner">
              <div className="grid h-full place-items-center rounded-2xl border border-orange-100 bg-white/45 text-7xl">🍝</div>
            </div>
            <div className="text-left">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-serif text-3xl font-black leading-tight">Pasta cremosa con pollo y tomate</h3>
                <Heart className="mt-2 text-orange-500" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2"><Clock size={16}/>25 min</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2"><Users size={16}/>2 porciones</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2"><BarChart3 size={16}/>Fácil</span>
              </div>
            </div>
          </div>
          <div className="mt-7 grid gap-7 border-t border-orange-100 pt-6 md:grid-cols-[.8fr_1.2fr]">
            <div className="text-left">
              <h4 className="mb-3 font-serif text-xl font-bold">Ingredientes</h4>
              <ul className="space-y-2 text-sm text-[#5c3b2c]">
                {['200 g de pasta','1 pechuga de pollo','1 tomate grande','1 diente de ajo','100 ml de crema de leche','Queso parmesano al gusto','Sal, pimienta y orégano'].map(i => <li key={i}>• {i}</li>)}
              </ul>
            </div>
            <div className="text-left">
              <h4 className="mb-3 font-serif text-xl font-bold">Preparación</h4>
              <ol className="space-y-3 text-sm text-[#5c3b2c]">
                {['Cocina la pasta según las instrucciones del paquete.','Corta el pollo en tiras, salpimienta y dóralo en una sartén.','Agrega ajo y tomate. Cocina 3–4 min.','Incorpora la crema y mezcla bien.','Añade la pasta y espolvorea queso al gusto.'].map((s, idx) => <li key={s} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white">{idx+1}</span>{s}</li>)}
              </ol>
              <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm"><strong>💡 Consejo del chef:</strong> agrega albahaca fresca al final y un toque de limón.</div>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-4 rounded-[28px] border border-white/70 bg-white/60 p-6 shadow-[0_24px_60px_rgba(120,53,15,.08)] backdrop-blur-xl md:grid-cols-3">
        {[['Rápido','Recetas listas en segundos para tu día a día.', Zap], ['Personalizado','La IA crea recetas a tu gusto con lo que tienes.', UserRound], ['Con lo que tienes','Aprovecha tus ingredientes y reduce el desperdicio.', ShoppingBasket]].map(([title, text, Icon]) => <div key={title} className="flex items-center gap-5 border-orange-100 px-6 md:not-last:border-r"><span className="grid h-16 w-16 place-items-center rounded-full bg-orange-100 text-orange-500"><Icon /></span><div><h3 className="font-serif text-xl font-bold">{title}</h3><p className="text-sm leading-6 text-[#74513f]">{text}</p></div></div>)}
      </section>
    </main>
  );
}
