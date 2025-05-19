import requests

# URL base da API
BASE_URL = "https://api.assertivasolucoes.com.br/localize/v3/cnpj"

HEADERS = {
    "Accept": "application/json"
}

# Token fixo - substitua pelo seu token válido quando necessário
# Este token deve ser atualizado manualmente quando expirar
TOKEN_FIXO = "98ef1e05-e4d9-461c-94eb-ca5750ef59bf" 

def consultar_cnpj(cnpj):
    token = TOKEN_FIXO

    if not token:
        return {"erro": "Token não configurado"}

    url = f"{BASE_URL}?cnpj={cnpj}&idFinalidade=1"
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    try:
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            return {"erro": "Token expirado ou inválido. Por favor, atualize o TOKEN_FIXO no arquivo consulta.py"}
        else:
            return {"erro": f"Erro {response.status_code}: {response.text}"}
    except Exception as e:
        return {"erro": f"Exceção: {str(e)}"}
