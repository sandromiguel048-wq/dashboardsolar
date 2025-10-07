import os
import json
import requests

# -------- CONFIG --------
USERNAME = "lopes"
PASSWORD = "Sandrolopes04"
DOMAIN = "eb-mapina.mondas.io"
LOGIN_URL = f"https://{DOMAIN}/httpdata/auth/login"
SENSOR_URL = f"https://{DOMAIN}/httpdata/sensor"
COOKIE_NAME = "mondas_session"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Origin": "https://eb-mapina.mondas.io",
    "Referer": "https://eb-mapina.mondas.io/test/monitor-1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Ch-Ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"'
}
# ------------------------

def fazer_login_automatico(username, password):
    print("🔐 A tentar login...")
    payload = {"username": username, "password": password}
    session = requests.Session()
    resp = session.post(LOGIN_URL, json=payload, headers=HEADERS)
    print("Login status:", resp.status_code)

    if resp.status_code == 204:
        cookies = session.cookies.get_dict()
        cookie_val = cookies.get(COOKIE_NAME)
        if cookie_val:
            print("🟢 Login bem-sucedido. Cookie obtido.")
            return cookie_val
    print("❌ Login falhou ou cookie não recebido.")
    return None

def testar_sensores(cookie_val):
    session = requests.Session()
    session.cookies.set(COOKIE_NAME, cookie_val, domain=DOMAIN)
    print("🧪 A testar sensores com filtros...")

    sites = ["mapina", "eb-mapina", "solar", "default"]
    grupos = ["solar", "energia", "sensor", "default"]
    tipos = ["energia", "temperatura", "potencia", "default"]

    resultados = []
    total = len(sites) * len(grupos) * len(tipos)
    contador = 0

    for site in sites:
        for grupo in grupos:
            for tipo in tipos:
                contador += 1
                selector = {
                    "type": "and",
                    "conditions": [
                        {"field": "site", "operator": "eq", "value": site},
                        {"field": "group", "operator": "eq", "value": grupo},
                        {"field": "type", "operator": "eq", "value": tipo}
                    ]
                }
                params = {"selector": json.dumps(selector)}
                try:
                    resp = session.get(SENSOR_URL, headers=HEADERS, params=params)
                    if resp.status_code == 200 and "application/json" in resp.headers.get("Content-Type", ""):
                        sensores = resp.json()
                        if sensores:
                            print(f"✅ {contador}/{total} → site={site}, grupo={grupo}, tipo={tipo} → {len(sensores)} sensores")
                            resultados.append({
                                "site": site,
                                "grupo": grupo,
                                "tipo": tipo,
                                "sensores": sensores
                            })
                        else:
                            print(f"⚠️ {contador}/{total} → sem sensores")
                    else:
                        print(f"❌ {contador}/{total} → rejeitado (status {resp.status_code})")
                except Exception as e:
                    print(f"❌ {contador}/{total} → erro: {e}")

    os.makedirs("dados_reais", exist_ok=True)
    with open("dados_reais/sensores_validos.json", "w", encoding="utf-8") as f:
        json.dump(resultados, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Resultados guardados em dados_reais/sensores_validos.json")

def main():
    cookie = fazer_login_automatico(USERNAME, PASSWORD)
    if not cookie:
        print("⚠️ Login automático falhou. Aborta.")
        return
    testar_sensores(cookie)

if __name__ == "__main__":
    main()
