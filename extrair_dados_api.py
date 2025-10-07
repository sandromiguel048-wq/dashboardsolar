import os
import json
import requests
from io import BytesIO
from msgpack import Unpacker

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

# Substitui por UUIDs reais que funcionam na tua conta
UUIDS_VALIDOS = [
    "fa582664-9e26-45fe-ab2f-f051b5dc5db5",
    "de6799c1-1fb7-4009-8c4b-1f6b6232c532",
    "c3c2a1b0-2461-4556-bb23-9f973606a2b1",
    "5a955df4-e5dc-4bc0-8bc1-276ecc909dde",
    "95a09144-0e29-4cf9-b43a-50cdb7b78215"
]

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

def extrair_dados(cookie_val):
    session = requests.Session()
    session.cookies.set(COOKIE_NAME, cookie_val, domain=DOMAIN)
    print("📡 A extrair dados reais...")

    payload = {"metadata": UUIDS_VALIDOS}
    resp = session.post(DATA_URL, headers=HEADERS, json=payload)
    ct = (resp.headers.get("Content-Type") or "").lower()

    if resp.status_code != 200 or "application/msgpack" not in ct:
        print("⚠️ Resposta inválida — não guardar como dados reais.")
        with open("dados_reais/resposta_bruta.msgpack", "wb") as f:
            f.write(resp.content)
        return

    buffer = BytesIO(resp.content)
    unpacker = Unpacker(buffer, raw=False)
    dados = [item for item in unpacker if isinstance(item, dict)]

    if not dados or not all("id" in item and "value" in item for item in dados):
        print("⚠️ Dados inválidos ou incompletos — não atualizar dashboard.")
        return

    os.makedirs("dados_reais", exist_ok=True)
    with open("dados_reais/dados_reais.json", "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)
    print("✅ Dados guardados em dados_reais/dados_reais.json")

def main():
    cookie = fazer_login_automatico(USERNAME, PASSWORD)
    if not cookie:
        print("⚠️ Login automático falhou. Aborta.")
        return
    extrair_dados(cookie)

if __name__ == "__main__":
    main()
