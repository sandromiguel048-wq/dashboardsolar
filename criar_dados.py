import sqlite3

conn = sqlite3.connect("dados.db")
cursor = conn.cursor()

# === Tabela de KPIs diários ===
cursor.execute("""
CREATE TABLE IF NOT EXISTS kpis_diarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data DATE NOT NULL,
  energia_kwh REAL,
  potencia_kw REAL,
  co2_evitado REAL,
  arvores_plantadas INTEGER,
  euros_poupados REAL
)
""")

# === Tabela de gráfico de produção/consumo ===
cursor.execute("""
CREATE TABLE IF NOT EXISTS grafico_producao_kw (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data DATETIME NOT NULL,
  producao_kw REAL,
  consumo_kw REAL
)
""")

# === Tabela de composição de consumo ===
cursor.execute("""
CREATE TABLE IF NOT EXISTS composicao_consumo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria TEXT NOT NULL,
  grafico_percentagem REAL
)
""")

# === Limpar dados antigos (opcional para testes) ===
cursor.execute("DELETE FROM kpis_diarios")
cursor.execute("DELETE FROM grafico_producao_kw")
cursor.execute("DELETE FROM composicao_consumo")

# === Inserir KPI de exemplo ===
cursor.execute("""
INSERT INTO kpis_diarios (data, energia_kwh, potencia_kw, co2_evitado, arvores_plantadas, euros_poupados)
VALUES ('2025-10-06', 120165.7, 4.01, 23, 32, 310.75)
""")

# === Inserir dados horários (produção vs consumo) ===
for h in range(6, 19):  # das 06h às 18h
    hora = f"2025-10-06 {h:02}:00:00"
    producao = round(4.01 * 0.9, 2)
    consumo = round(4.01 * 0.75, 2)
    cursor.execute("""
    INSERT INTO grafico_producao_kw (data, producao_kw, consumo_kw)
    VALUES (?, ?, ?)
    """, (hora, producao, consumo))

# === Inserir composição de consumo ===
cursor.executemany("""
INSERT INTO composicao_consumo (categoria, grafico_percentagem)
VALUES (?, ?)
""", [
    ("Iluminação", 48),
    ("Equipamentos", 26),
    ("Outros", 26)
])

conn.commit()
conn.close()

print("✅ Base de dados 'dados.db' criada e populada com sucesso!")
