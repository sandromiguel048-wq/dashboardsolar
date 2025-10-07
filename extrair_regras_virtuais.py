import os
import json
import requests
from io import BytesIO
from msgpack import Unpacker

# -------- CONFIG --------
USERNAME = "lopes"
PASSWORD = "Sandrolopes04"
DOMAIN = "eb-mapina.mondas.io"
LOGIN_URL = f"https://{DOMAIN}/httpdata/auth/login"
RULES_URL = f"https://{DOMAIN}/httpdata/virtual-sensor-rules"
COOKIE_NAME = "mondas_session"

HEADERS = {
    "Accept": "application/msgpack",
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

def extrair_regras(cookie_val):
    session = requests.Session()
    session.cookies.set(COOKIE_NAME, cookie_val, domain=DOMAIN)
    print("📦 A extrair regras de sensores virtuais...")

    try:
        resp = session.get(RULES_URL, headers=HEADERS)
        ct = (resp.headers.get("Content-Type") or "").lower()

        if resp.status_code == 200 and "application/msgpack" in ct:
            buffer = BytesIO(resp.content)
            unpacker = Unpacker(buffer, raw=False)
            regras = [item for item in unpacker if isinstance(item, dict)]

            os.makedirs("dados_reais", exist_ok=True)
            with open("dados_reais/regras_virtuais.json", "w", encoding="utf-8") as f:
                json.dump(regras, f, indent=2, ensure_ascii=False)

            print(f"✅ Regras guardadas em dados_reais/regras_virtuais.json")
            print(f"🔢 Total de regras encontradas: {len(regras)}")
        else:
            print(f"❌ Resposta inválida (status {resp.status_code}, content-type {ct})")
    except Exception as e:
        print(f"❌ Erro ao extrair regras: {e}")

def main():
    cookie = fazer_login_automatico(USERNAME, PASSWORD)
    if not cookie:
        print("⚠️ Login automático falhou. Aborta.")
        return
    extrair_regras(cookie)

if __name__ == "__main__":
    main()
