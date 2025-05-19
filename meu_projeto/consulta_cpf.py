import requests

# URL base da API
BASE_URL = "https://api.assertivasolucoes.com.br/localize/v3/cpf"

HEADERS = {
    "Accept": "application/json"
}

# Token fixo - substitua pelo seu token válido quando necessário
# Este token deve ser atualizado manualmente quando expirar
TOKEN_FIXO = "98ef1e05-e4d9-461c-94eb-ca5750ef59bf"  

def consultar_cpf(cpf, id_finalidade=1):
    """
    Consulta um CPF na API da Assertiva

    Args:
        cpf (str): CPF a ser consultado
        id_finalidade (int): ID da finalidade (1=Confirmação de identidade, 2=Ciclo de crédito, etc)

    Returns:
        dict: Resultado da consulta
    """
    token = TOKEN_FIXO

    if not token:
        return {"erro": "Token não configurado"}

    url = f"{BASE_URL}?cpf={cpf}&idFinalidade={id_finalidade}"
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    try:
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            return {"erro": "Token expirado ou inválido. Por favor, atualize o TOKEN_FIXO no arquivo consulta_cpf.py"}
        else:
            return {"erro": f"Erro {response.status_code}: {response.text}"}
    except Exception as e:
        return {"erro": f"Exceção: {str(e)}"}

