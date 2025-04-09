import requests
import time

# Credenciais da API (substitua pelas suas)
CLIENT_ID = "dMSL+6vmrpqHk5tC+Dv1mz+9nuMjV+SaO9WAQhOfrtP5YFBw8vDWs3x+8OAipQvhn+LI5pcUmuw2wjeJruJR+g=="
CLIENT_SECRET = "5Uuc0Gj/3qcChhApXHaROYmg6vZKDhpigg9/v/Oknm1TOu5pn6AUfZDQ47sDMFFvWEPyML4/K7K9WUimBxfveg=="

# Variável global para armazenar o token
TOKEN = '790a0ec1-3ea1-4aaa-9399-debcb3d1045d'
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