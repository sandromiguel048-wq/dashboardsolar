from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import sqlite3
import os
import logging

# Configuração de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Caminho absoluto do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'dados.db')

app = Flask(__name__, static_folder='build', static_url_path='/')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/data')
def get_dashboard_data():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # KPIs - pega o último registo
        cursor.execute("""
            SELECT energia_kwh, potencia_kw, co2_evitado, arvores_plantadas, euros_poupados
            FROM kpis_diarios
            ORDER BY data DESC LIMIT 1
        """)
        row = cursor.fetchone()
        energia_kwh = row[0] if row else 0
        potencia_kw = row[1] if row else 0
        co2_evitado = row[2] if row else 0
        arvores = row[3] if row else 0
        euros = row[4] if row else 0

        # Gráfico de produção - pega todos os registos existentes
        cursor.execute("""
            SELECT data, producao_kw, consumo_kw
            FROM grafico_producao_kw
            ORDER BY data ASC
        """)
        grafico = cursor.fetchall()
        labels = [linha[0].split(' ')[1][:2] + 'h' for linha in grafico]  # pega hora HH
        producao = [linha[1] for linha in grafico]
        consumo = [linha[2] for linha in grafico]

        # Composição de consumo
        cursor.execute("""
            SELECT categoria, grafico_percentagem
            FROM composicao_consumo
            ORDER BY id ASC
        """)
        comp = cursor.fetchall()
        comp_labels = [linha[0] for linha in comp]
        comp_valores = [linha[1] for linha in comp]

        conn.close()

        return jsonify({
            "kpis": {
                "kwh_producao": round(energia_kwh, 1),
                "kw_agora": round(potencia_kw, 2),
                "toneladas_co2": round(co2_evitado, 2),
                "arvores_plantadas": arvores,
                "euros_poupados": round(euros, 2)
            },
            "grafico_producao": {
                "labels": labels,
                "producao": producao,
                "consumo": consumo
            },
            "composicao_consumo": {
                "labels": comp_labels,
                "valores": comp_valores
            }
        })
    except Exception as e:
        logger.error(f"Erro ao obter dados: {e}")
        return jsonify({"erro": str(e)}), 500

# Somente para testes locais
if __name__ == "__main__":
    app.run(debug=True)
