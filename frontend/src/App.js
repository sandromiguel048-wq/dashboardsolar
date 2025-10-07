import React, { useState, useEffect } from 'react';
import './style.css';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ChartDataLabels
);

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const json = await response.json();
        setData(json);

        setMessages([
          `🔆 Produzidos ${json.kpis.kwh_producao} kWh — evitadas ${json.kpis.toneladas_co2} toneladas de CO₂ e poupadas ${json.kpis.arvores_plantadas} árvores 🌱`,
          `🌍 Reduzimos ${json.kpis.toneladas_co2} toneladas de CO₂ — ótimo progresso!`,
          `💰 Poupança estimada: ${json.kpis.euros_poupados} euros — energia limpa compensa!`
        ]);
      } catch (error) {
        console.error('Erro a carregar os dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 16000);
    return () => clearInterval(interval);
  }, [messages]);

  if (loading || !data) {
    return <div className="loading">A carregar dados...</div>;
  }

  const { kpis, grafico_producao, composicao_consumo } = data;

  const lineChartData = {
    labels: grafico_producao.labels,
    datasets: [
      {
        label: 'Produção',
        data: grafico_producao.producao,
        borderColor: '#FF3B30',
        backgroundColor: 'transparent',
        tension: 0.4
      },
      {
        label: 'Consumo',
        data: grafico_producao.consumo,
        borderColor: '#3B82F6',
        backgroundColor: 'transparent',
        tension: 0.4
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#333', font: { size: 12, weight: 'bold' } }
      },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label}: ${context.parsed.y} kWh`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#333', font: { size: 10 }, autoSkip: false }
      },
      y: {
        ticks: {
          color: '#333',
          font: { size: 10 },
          callback: value => `${value} kWh`
        }
      }
    }
  };

  const totalConsumo = composicao_consumo.valores.reduce((sum, v) => sum + v, 0);
  const porcentagens = composicao_consumo.valores.map(v =>
    ((v / totalConsumo) * 100).toFixed(0)
  );

  const barChartData = {
    labels: composicao_consumo.labels,
    datasets: [
      {
        data: composicao_consumo.valores,
        backgroundColor: ['#FF9800', '#3B82F6', '#607D8B'],
        barThickness: 20,
        porcentagens
      }
    ]
  };

  const barChartOptions = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'right',
        formatter: (value, context) =>
          `${context.dataset.porcentagens[context.dataIndex]}%`,
        color: '#333',
        font: { weight: 'bold' }
      }
    },
    scales: { x: { display: false }, y: { grid: { display: false } } }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="main-title">ENERGIA SOLAR EM TEMPO REAL</h1>
        </div>
        <div className="header-right">
          <img
            src="/Logo_Energaia_Energy_Agency_Porto.png"
            alt="Logo Energaia"
            className="header-logo"
          />
        </div>
      </header>

      <main className="dashboard-content">
        <section className="kpi-section">
          <h2>KPI Produção</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <img src="/carregador-de-smartphone.png" alt="Icon Bateria" className="kpi-image-icon" />
              <div className="kpi-value-main">{kpis.kwh_producao}</div>
                            <div className="kpi-unit-kwh">kWh</div>
            </div>
            <div className="kpi-card">
              <img src="/sol.png" alt="Icon Sol" className="kpi-image-icon" />
              <div className="kpi-value-main">{kpis.kw_agora}</div>
              <div className="kpi-unit">kW</div>
            </div>
            <div className="kpi-card">
              <img src="/co2.png" alt="Icon CO2" className="kpi-image-icon" />
              <div className="kpi-value-main">{kpis.toneladas_co2}</div>
              <div className="kpi-unit">Tons CO₂</div>
            </div>
            <div className="kpi-card">
              <img src="/tree.png" alt="Icon Árvore" className="kpi-image-icon" />
              <div className="kpi-value-main">{kpis.arvores_plantadas}</div>
              <div className="kpi-unit">Árvores</div>
            </div>
            <div className="kpi-card">
              <img src="/euro.png" alt="Icon Euro" className="kpi-image-icon" />
              <div className="kpi-value-main">{kpis.euros_poupados}</div>
              <div className="kpi-unit">€</div>
            </div>
          </div>
        </section>

        <section className="charts-section">
          <div className="chart-container-line-full">
            <h2>Produção & Consumo</h2>
            <div className="chart-content">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          <div className="chart-container-right">
            <h2>Composição de Consumo</h2>
            <div className="chart-content">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </section>

        <section className="ticker-section">
          <div className="ticker">
            <p>{messages[currentMessageIndex]}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
