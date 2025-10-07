import React, { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/data")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <p>🔄 A carregar dados reais...</p>;

  const { kpis, grafico_producao, composicao_consumo } = data;

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>☀️ Dashboard Solar em Tempo Real</h2>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <KPI label="Produção Hoje" value={`${kpis.kwh_producao} kWh`} />
        <KPI label="Potência Atual" value={`${kpis.kw_agora} kW`} />
        <KPI label="CO₂ Evitado" value={`${kpis.toneladas_co2} Ton`} />
        <KPI label="Árvores Equivalentes" value={kpis.arvores_plantadas} />
        <KPI label="€ Poupados" value={`€ ${kpis.euros_poupados}`} />
      </div>

      <div style={{ maxWidth: "800px", marginBottom: "3rem" }}>
        <h3>📈 Produção vs Consumo</h3>
        <Line
          data={{
            labels: grafico_producao.labels,
            datasets: [
              {
                label: "Produção (kW)",
                data: grafico_producao.producao,
                borderColor: "green",
                backgroundColor: "rgba(0,128,0,0.2)",
              },
              {
                label: "Consumo (kW)",
                data: grafico_producao.consumo,
                borderColor: "orange",
                backgroundColor: "rgba(255,165,0,0.2)",
              },
            ],
          }}
        />
      </div>

      <div style={{ maxWidth: "400px" }}>
        <h3>🧩 Composição do Consumo</h3>
        <Pie
          data={{
            labels: composicao_consumo.labels,
            datasets: [
              {
                data: composicao_consumo.valores,
                backgroundColor: ["#4caf50", "#2196f3", "#ff9800"],
              },
            ],
          }}
        />
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div style={{
      background: "#f0f0f0",
      padding: "1rem",
      borderRadius: "8px",
      minWidth: "150px",
      textAlign: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h4>{label}</h4>
      <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{value}</p>
    </div>
  );
}
