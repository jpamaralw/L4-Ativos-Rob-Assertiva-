import requests
import time

# Credenciais da API (substitua pelas suas)
CLIENT_ID = "xxxx"
CLIENT_SECRET = "xxxx"

# Variável global para armazenar o token
TOKEN = 'xxxx'
EXPIRACAO = 0  # Tempo em que o token expira


def obter_token():
    global TOKEN, EXPIRACAO
    if TOKEN and time.time() < EXPIRACAO:
        print("Token ainda válido, retornando...")
        return TOKEN  # Retorna o token se ainda estiver válido

    print("Obtendo um novo token...")

    url = "https://api.assertivasolucoes.com.br/oauth2/v3/token"
    headers = {"Content-Type": "application/json"}
    payload = {"clientId": CLIENT_ID, "clientSecret": CLIENT_SECRET}

    try:
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code == 200:
            TOKEN = response.json().get("access_token")
            EXPIRACAO = time.time() + 1800  # O token expira em 30 minutos
            print(f"Novo token obtido: {TOKEN}")
            return TOKEN
        else:
            print("Erro ao obter token:", response.text)
            return None
    except Exception as e:
        print(f"Exceção ao obter token: {str(e)}")
        return None


# Testar a função diretamente
if __name__ == "__main__":
    obter_token()
