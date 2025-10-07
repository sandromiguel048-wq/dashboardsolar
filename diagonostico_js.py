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
DATA_URL = f"https://{DOMAIN}/httpdata/metadata"
COOKIE_NAME = "mondas_session"

HEADERS = {
    "Content-Type": "application/json",
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

def testar_ids(cookie_val):
    session = requests.Session()
    session.cookies.set(COOKIE_NAME, cookie_val, domain=DOMAIN)
    print("🧪 A testar IDs de 1 a 50...")

    ids_validos = []
    for id in range(1, 51):
        payload = {"metadata": [id]}
        resp = session.post(DATA_URL, headers=HEADERS, json=payload)
        ct = (resp.headers.get("Content-Type") or "").lower()

        if resp.status_code == 200 and "application/msgpack" in ct:
            buffer = BytesIO(resp.content)
            unpacker = Unpacker(buffer, raw=False)
            dados = [item for item in unpacker if isinstance(item, dict)]
            if dados:
                ids_validos.append(id)
                print(f"✅ ID {id} válido")
            else:
                print(f"⚠️ ID {id} sem dados")
        else:
            print(f"❌ ID {id} rejeitado (status {resp.status_code})")

    os.makedirs("dados_reais", exist_ok=True)
    with open("dados_reais/ids_validos.json", "w", encoding="utf-8") as f:
        json.dump(ids_validos, f, indent=2)
    print(f"\n✅ IDs válidos guardados em dados_reais/ids_validos.json")

def main():
    os.makedirs("dados_reais", exist_ok=True)
    cookie = fazer_login_automatico(USERNAME, PASSWORD)
    if not cookie:
        print("⚠️ Login automático falhou. Aborta.")
        return
    testar_ids(cookie)

if __name__ == "__main__":
    main()
