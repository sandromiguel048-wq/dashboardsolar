import json
import sys
import os

CAMINHO = "dados_reais/dados_reais.json"

def validar_ficheiro():
    if not os.path.exists(CAMINHO):
        print(f"❌ Ficheiro não encontrado: {CAMINHO}")
        sys.exit(1)

    try:
        with open(CAMINHO, "r", encoding="utf-8") as f:
            dados = json.load(f)
    except Exception as e:
        print(f"❌ Erro ao ler JSON: {e}")
        sys.exit(1)

    if not isinstance(dados, list):
        print("❌ O conteúdo não é uma lista.")
        sys.exit(1)

    for i, item in enumerate(dados):
        if not isinstance(item, dict):
            print(f"❌ Item {i} não é um objeto.")
            sys.exit(1)
        if "id" not in item or "value" not in item:
            print(f"❌ Item {i} está incompleto: {item}")
            sys.exit(1)
        if not isinstance(item["id"], int):
            print(f"❌ 'id' inválido no item {i}: {item['id']}")
            sys.exit(1)
        if not isinstance(item["value"], (int, float)):
            print(f"❌ 'value' inválido no item {i}: {item['value']}")
            sys.exit(1)

    print("✅ Ficheiro de dados reais validado com sucesso.")

if __name__ == "__main__":
    validar_ficheiro()
