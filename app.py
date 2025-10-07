from flask import Flask, jsonify, send_from_directory, request
import sqlite3
import os

app = Flask(__name__, static_folder='build', static_url_path='/')

@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/data')
def get_dashboard_data():
    period = request.args.get('period', 'dia')

    conn = sqlite3.connect("dados.db")
    cursor = conn.cursor()

    # === KPIs ===
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

    # === Gráfico de produção e consumo ===
    if period == 'hora':
        cursor.execute("""
            SELECT strftime('%Hh', data), producao_kw, consumo_kw
            FROM grafico_producao_kw
            WHERE date(data) = date('now')
            ORDER BY data ASC
        """)
    elif period == 'dia':
        cursor.execute("""
            SELECT strftime('%d/%m', data), SUM(producao_kw), SUM(consumo_kw)
            FROM grafico_producao_kw
            WHERE date(data) >= date('now', '-1 day')
            GROUP BY date(data)
            ORDER BY date(data) ASC
        """)
    elif period == 'semana':
        cursor.execute("""
            SELECT strftime('%w', data), SUM(producao_kw), SUM(consumo_kw)
            FROM grafico_producao_kw
            WHERE date(data) >= date('now', '-7 days')
            GROUP BY strftime('%w', data)
            ORDER BY strftime('%w', data) ASC
        """)
    elif period == 'mes':
        cursor.execute("""
            SELECT strftime('%d/%m', data), SUM(producao_kw), SUM(consumo_kw)
            FROM grafico_producao_kw
            WHERE strftime('%m', data) = strftime('%m', 'now')
            GROUP BY date(data)
            ORDER BY date(data) ASC
        """)
    elif period == 'ano':
        cursor.execute("""
            SELECT strftime('%m/%Y', data), SUM(producao_kw), SUM(consumo_kw)
            FROM grafico_producao_kw
            WHERE strftime('%Y', data) = strftime('%Y', 'now')
            GROUP BY strftime('%m', data)
            ORDER BY strftime('%m', data) ASC
        """)
    else:
        cursor.execute("""
            SELECT strftime('%Hh', data), producao_kw, consumo_kw
            FROM grafico_producao_kw
            WHERE date(data) = date('now')
            ORDER BY data ASC
        """)

    grafico = cursor.fetchall()
    labels = [linha[0] for linha in grafico]
    producao = [linha[1] for linha in grafico]
    consumo = [linha[2] for linha in grafico]

    # === Composição de consumo ===
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

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True)
