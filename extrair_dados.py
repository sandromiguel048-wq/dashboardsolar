from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time, json

USERNAME = "lopes"
PASSWORD = "Sandrolopes04"

options = Options()
options.add_argument("--headless")
driver = webdriver.Chrome(options=options)
driver.get("https://eb-mapina.mondas.io/monitor")

wait = WebDriverWait(driver, 30)

# Espera o iframe aparecer
wait.until(EC.presence_of_element_located((By.TAG_NAME, "iframe")))
iframes = driver.find_elements(By.TAG_NAME, "iframe")
print(f"🔍 {len(iframes)} iframe(s) encontrados")

# Muda para o primeiro iframe (ou ajusta o índice se necessário)
driver.switch_to.frame(iframes[0])

# Espera o campo de login aparecer dentro do iframe
wait.until(EC.presence_of_element_located((By.ID, "login_username")))

# Preenche os campos
driver.find_element(By.ID, "login_username").send_keys(USERNAME)
driver.find_element(By.ID, "login_password").send_keys(PASSWORD)
driver.find_element(By.ID, "login-button").click()

# Volta ao contexto principal
driver.switch_to.default_content()
time.sleep(8)

# Extrair dados (ajusta os seletores conforme necessário)
energia_hoje = driver.find_element(By.XPATH, "//div[contains(text(),'Produção')]/following-sibling::div").text
producao_kw = driver.find_element(By.XPATH, "//div[contains(text(),'Produção')]/following-sibling::div").text
co2 = driver.find_element(By.XPATH, "//div[contains(text(),'CO2')]").text
arvores = driver.find_element(By.XPATH, "//div[contains(text(),'Árvores')]").text
driver.save_screenshot("estado_atual.png")


driver.quit()

dados = {
    "energia_hoje": energia_hoje.replace("kWh", "").strip(),
    "producao_kw": producao_kw.replace("kW", "").strip(),
    "co2": co2.replace("kg", "").strip(),
    "arvores": arvores.replace("Árvores plantadas", "").strip()
}

with open("dados_reais.json", "w") as f:
    json.dump(dados, f)

print("✅ Dados extraídos e guardados com sucesso!")
