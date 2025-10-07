import React, { useEffect, useState } from "react";

const Dashboard = () => {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_URL || "";
    fetch(`${baseURL}/api/data?period=dia`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro na resposta da API");
        return res.json();
      })
      .then((data) => setDados(data))
      .catch((err) => setErro(err.message));
  }, []);

  if (erro) return <div>Erro: {erro}</div>;
  if (!dados) return <div>A carregar dados...</div>;

  return (
    <div>
      <h2>Produção Solar</h2>
      <p>kWh Produzidos: {dados.kpis.kwh_producao}</p>
      <p>Potência Atual: {dados.kpis.kw_agora} kW</p>
      <p>CO₂ Evitado: {dados.kpis.toneladas_co2} toneladas</p>
      <p>Árvores Plantadas: {dados.kpis.arvores_plantadas}</p>
      <p>€ Poupados: {dados.kpis.euros_poupados}</p>
      {/* Aqui podes adicionar os gráficos e outros componentes */}
    </div>
  );
};

export default Dashboard;
