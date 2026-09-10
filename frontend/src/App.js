import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const fmt = (v, dec = 2) => {
  const n = Number(v);
  if (isNaN(n)) return "0,00";
  return n.toLocaleString("pt-PT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};
const safe = (v) => Number(v) || 0;

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function App() {
  const [data, setData]         = useState(null);
  const [scale, setScale]       = useState(1);
  const [flyer, setFlyer]       = useState(0);
  const [showSlide, setShowSlide] = useState(false);
  const clock = useClock();

  const flyers = ["/flyer.png", "/ano-letivo-2026-2027.jpeg", "/flyer2.png.jpeg"];

  useEffect(() => {
    const handle = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080) * 0.98);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFlyer(p => (p + 1) % flyers.length), 120000);
    return () => clearInterval(t);
  }, [flyers.length]);

  // Flyer a ecrã inteiro: aparece a cada 45s, fica 8s, e desaparece
  useEffect(() => {
    let hideTimer;
    const showEvery = setInterval(() => {
      setShowSlide(true);
      hideTimer = setTimeout(() => setShowSlide(false), 30000);
    }, 240000);
    return () => { clearInterval(showEvery); clearTimeout(hideTimer); };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5002"}/api/kpis`);
        setData(await res.json());
      } catch (e) { console.error(e); }
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const d = data || {};
  const {
    data_hora,
    pv_current_kw = 0, battery_current_kw = 0, rede_kw = 0, injecao_kw = 0,
    autoconsumo_kw = 0, pot_total_kw = 0, kwh_producao = 0, kwh_consumo = 0,
    kwh_injecao = 0, kwh_autoconsumo = 0, toneladas_co2 = 0, carvao_poupado = 0, arvores_plantadas = 0,
  } = d;

  const C = {
    pv: "#F59E0B", load: "#8B5CF6", grid: "#EF4444",
    inject: "#3B82F6", battery: "#6366F1", auto: "#10B981",
    co2: "#22C55E", coal: "#A855F7", tree: "#16A34A",
  };

  const overlays = [
    { label: "BATERIA",     value: battery_current_kw, color: C.battery, top: "60%",   left: "12%",  icon: "🔋" },
    { label: "CARGA",       value: pot_total_kw,        color: C.load,    top: "22%",   left: "22%",  icon: "⚡" },
    { label: "PV",          value: pv_current_kw,       color: C.pv,      top: "40%",   left: "42%",  icon: "☀️" },
    { label: "AUTOCONSUMO", value: autoconsumo_kw,      color: C.auto,    top: "47%",   right: "12%", icon: "🔄" },
    { label: "INJEÇÃO",     value: injecao_kw,          color: C.inject,  top: "16%",   right: "10%", icon: "📤" },
    { label: "REDE",        value: rede_kw,             color: C.grid,    top: "83%",   left: "82%",  icon: "🔌" },
    { label: "TOTAL",       value: pot_total_kw,        color: "#475569", bottom: "20%",left: "42%",  icon: "📊" },
  ];

  const envCards = [
    { icon: "/co2.png",  label: "CO₂ Evitado",   value: fmt(toneladas_co2),        unit: "ton",     color: C.co2  },
    { icon: "/tree.png", label: "Árvores Equiv.", value: fmt(arvores_plantadas, 0), unit: "árvores", color: C.tree },
    { icon: "/euro.png", label: "Carvão Poupado", value: fmt(carvao_poupado),       unit: "ton",     color: C.coal },
  ];

  const barOpts = (colors) => ({
    indexAxis: "y",
    maintainAspectRatio: false,
    responsive: true,
    devicePixelRatio: 2,
    layout: { padding: { right: 60 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        color: "#1E293B",
        backgroundColor: ctx => colors[ctx.dataIndex] + "28",
        borderRadius: 5,
        padding: { top: 3, bottom: 3, left: 8, right: 8 },
        font: { weight: "700", size: 13 },
        align: "end", anchor: "end",
        formatter: v => fmt(v),
      },
    },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 11 }, color: "#94A3B8" }, border: { display: false } },
      y: { grid: { display: false }, ticks: { font: { weight: "600", size: 13 }, color: "#374151" }, border: { display: false } },
    },
  });

  const grad = (ctx, color) => {
    try {
      const g = ctx.chart.ctx.createLinearGradient(0, 0, ctx.chart.width, 0);
      g.addColorStop(0, color + "FF"); g.addColorStop(1, color + "88");
      return g;
    } catch { return color; }
  };

  const consumoColors  = [C.auto, C.grid, "#94A3B8"];
  const producaoColors = [C.auto, C.inject, "#94A3B8"];

  const consumoData = {
    labels: ["Autoconsumo", "Rede", "Total"],
    datasets: [{ data: [safe(kwh_autoconsumo), safe(kwh_consumo), safe(kwh_autoconsumo) + safe(kwh_consumo)], backgroundColor: ctx => grad(ctx, consumoColors[ctx.dataIndex]), borderRadius: 8, barThickness: 34 }],
  };
  const producaoData = {
    labels: ["Autoconsumo", "Injeção", "Total"],
    datasets: [{ data: [safe(kwh_autoconsumo), safe(kwh_injecao), safe(kwh_producao)], backgroundColor: ctx => grad(ctx, producaoColors[ctx.dataIndex]), borderRadius: 8, barThickness: 34 }],
  };

  const ticker = `☀️ Produzidos ${fmt(kwh_producao)} kWh  •  🌍 Evitadas ${fmt(toneladas_co2)} t CO₂  •  🌱 ${fmt(arvores_plantadas, 0)} árvores equivalentes  •  ⚡ Carga atual ${fmt(pot_total_kw)} kW  •  🔋 Bateria ${fmt(battery_current_kw)} kW  •  📤 Injeção ${fmt(injecao_kw)} kW`;

  const card = (extra = {}) => ({
    background: "#FFFFFF",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.06)",
    ...extra,
  });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0F172A; overflow: hidden; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fadeIn  { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes blink   { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .fade-img { animation: fadeIn 0.7s ease; }
        .live-dot { animation: blink 2s ease-in-out infinite; }
      `}</style>

      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "1920px", height: "1080px",
          background: "#F1F5F9",
          transform: `scale(${scale})`, transformOrigin: "center center",
          display: "grid",
          gridTemplateRows: "620px 1fr 60px",
          padding: "16px 24px",
          gap: "14px",
          boxSizing: "border-box",
          boxShadow: "0 0 120px rgba(0,0,0,0.7)",
          position: "relative",
        }}>

          {/* ── MAIN: IMAGEM + PAINEL LATERAL ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: "14px" }}>

            {/* FOTO DA ESCOLA — header como overlay */}
            <div style={{ ...card(), position: "relative", overflow: "hidden" }}>
              <img
                src="/dashboard_foto.png" alt="Escola"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "0 65%", display: "block" }}
              />

              {/* HEADER OVERLAY no topo da imagem */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                background: "linear-gradient(180deg, rgba(10,18,36,0.92) 0%, rgba(10,18,36,0.65) 35%, transparent 100%)",
                padding: "12px 22px 16px",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              }}>
                {/* Título */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "4px", height: "44px", background: "linear-gradient(180deg,#F59E0B,#EF4444)", borderRadius: "4px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Dashboard Solar · procuRE</div>
                    <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                      Escola Básica Manuel António Pina
                    </h1>
                  </div>
                </div>

                {/* Direita: hora + logo */}
                <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.65rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                      Última atualização
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#94A3B8", fontWeight: 500 }}>
                      {data_hora ? new Date(data_hora).toLocaleString("pt-PT") : "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px", marginBottom: "2px" }}>
                      <span className="live-dot" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                      <span style={{ fontSize: "0.65rem", color: "#22C55E", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Ao Vivo</span>
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#F8FAFC", letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      {clock.toLocaleTimeString("pt-PT")}
                    </div>
                  </div>
                  <img src="/Logo_Energaia_Energy_Agency_Porto.png" alt="Logo"
                    style={{ height: "46px", filter: "brightness(0) invert(1)", opacity: 0.88 }} />
                </div>
              </div>

              {/* OVERLAYS DE ENERGIA */}
              {overlays.map((o, i) => (
                <div key={i} style={{
                  position: "absolute", top: o.top, bottom: o.bottom, left: o.left, right: o.right,
                  transform: "translate(-50%, -50%)",
                  background: "rgba(255,255,255,0.96)",
                  borderLeft: `4px solid ${o.color}`,
                  borderRadius: "12px",
                  padding: "9px 16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                  minWidth: "128px",
                  backdropFilter: "blur(6px)",
                }}>
                  <div style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                    {o.icon} {o.label}
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                    {fmt(o.value)} <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "#64748B" }}>kW</span>
                  </div>
                </div>
              ))}
            </div>

            {/* PAINEL LATERAL: FLYER + IMPACTO AMBIENTAL */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", minHeight: 0, overflow: "hidden" }}>

              {/* FLYER ROTATIVO */}
              <div style={{ ...card({ background: "#f0f2f5", overflow: "hidden" }), flex: 2.5, position: "relative", minHeight: 0 }}>
                <img
                  key={flyer}
                  src={flyers[flyer]}
                  alt="Informação"
                  className="fade-img"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain", borderRadius: "16px" }}
                />
              </div>

              {/* IMPACTO AMBIENTAL */}
              <div style={{ ...card({ padding: "10px 14px" }), flex: 1.4, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexShrink: 0 }}>
                  <div style={{ width: "3px", height: "16px", background: `linear-gradient(180deg,${C.co2},${C.tree})`, borderRadius: "3px" }} />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1E293B" }}>Impacto Ambiental</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  {envCards.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "6px 10px",
                      background: item.color + "10",
                      borderRadius: "10px",
                      border: `1px solid ${item.color}25`,
                      flex: 1,
                    }}>
                      <img src={item.icon} alt="" style={{ width: "24px", height: "24px", objectFit: "contain", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.58rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{item.label}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap" }}>
                          {item.value} <span style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: 500 }}>{item.unit}</span>
                        </div>
                      </div>
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── GRÁFICOS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

            <div style={{ ...card({ padding: "16px 20px" }), display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "3px", height: "20px", background: `linear-gradient(180deg,${C.grid},${C.auto})`, borderRadius: "3px" }} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B" }}>Consumo Diário</span>
                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#94A3B8", background: "#F1F5F9", padding: "2px 10px", borderRadius: "20px", fontWeight: 600 }}>kWh</span>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <Bar data={consumoData} options={barOpts(consumoColors)} />
              </div>
            </div>

            <div style={{ ...card({ padding: "16px 20px" }), display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "3px", height: "20px", background: `linear-gradient(180deg,${C.pv},${C.inject})`, borderRadius: "3px" }} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B" }}>Produção Diária</span>
                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#94A3B8", background: "#F1F5F9", padding: "2px 10px", borderRadius: "20px", fontWeight: 600 }}>kWh</span>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <Bar data={producaoData} options={barOpts(producaoColors)} />
              </div>
            </div>
          </div>

          {/* ── TICKER ── */}
          <div style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
            borderRadius: "14px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 4px 16px rgba(15,23,42,0.3)",
          }}>
            <div style={{
              background: "linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)",
              padding: "0 22px",
              height: "100%",
              display: "flex", alignItems: "center", gap: "8px",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: "1.1rem" }}>☀️</span>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>Hoje</span>
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                animation: "marquee 40s linear infinite",
                color: "#CBD5E1",
                fontSize: "1rem",
                fontWeight: 500,
                paddingLeft: "40px",
                letterSpacing: "0.01em",
              }}>
                {ticker}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ticker}
              </div>
            </div>
          </div>

          {/* ── FLYER A ECRÃ INTEIRO ── */}
          {showSlide && (
            <div style={{
              position: "absolute", inset: 0,
              zIndex: 50,
              background: "#0F172A",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "fadeIn 0.6s ease",
            }}>
              <img
                key={flyer}
                src={flyers[flyer]}
                alt="Flyer"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default App;
