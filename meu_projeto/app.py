from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from consulta import consultar_cnpj
from consulta_cpf import consultar_cpf
import pandas as pd
import os
import json
import re
import time
import logging
from datetime import datetime

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

CORS(app)

# Diretório para armazenar arquivos CSV
CSV_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'csv_files')
os.makedirs(CSV_DIR, exist_ok=True)


def limpar_cnpj(cnpj):
    if not cnpj:
        return ""
    return re.sub(r'[^\d]', '', str(cnpj))


def limpar_telefone(telefone):
    if not telefone:
        return ""
    return re.sub(r'[^\d]', '', str(telefone))


def extrair_dados_cnpj(resultado):
    """
    Função para extrair e estruturar os dados do CNPJ retornados pela API
    com melhorias na formatação e organização
    """
    dados = {}

    try:
        if isinstance(resultado.get('cabecalho'), str):
            cabecalho = json.loads(resultado.get('cabecalho', '{}'))
        else:
            cabecalho = resultado.get('cabecalho', {})

        if isinstance(resultado.get('resposta'), str):
            resposta = json.loads(resultado.get('resposta', '{}'))
        else:
            resposta = resultado.get('resposta', {})

        # Dados empresa
        dados_cadastrais = resposta.get('dadosCadastrais', {})
        dados['CNPJ'] = limpar_cnpj(dados_cadastrais.get('cnpj', ''))

        dados['Razao_Social'] = dados_cadastrais.get('razaoSocial', '')
        dados['Nome_Fantasia'] = dados_cadastrais.get('nomeFantasia', '')
        dados['Situacao_Cadastral'] = dados_cadastrais.get('situacaoCadastral', '')
        dados['Data_Abertura'] = dados_cadastrais.get('dataAbertura', '')
        dados['Porte'] = dados_cadastrais.get('porteEmpresa', '')
        dados['Natureza_Juridica'] = dados_cadastrais.get('naturezaJuridica', '')

        cnaes = []
        if dados_cadastrais.get('cnaeDescricao'):
            cnaes.append(dados_cadastrais.get('cnaeDescricao'))

        cnaes_secundarias = resposta.get('cnaesSecundarias', [])
        for cnae in cnaes_secundarias:
            if cnae.get('descricao'):
                cnaes.append(cnae.get('descricao'))

        # Juntar todos os CNAEs com separador //
        dados['CNAE'] = " // ".join(cnaes) if cnaes else ""

        dados['Qtd_Funcionarios'] = dados_cadastrais.get('quantidadeFuncionarios', '')
        dados['Site'] = dados_cadastrais.get('site', '')

        telefones = resposta.get('telefones', {})

        fixos = telefones.get('fixos', [])
        for i, tel in enumerate(fixos[:2]):  # Limitar a 2 telefones
            dados[f'Telefone_Fixo_{i + 1}'] = limpar_telefone(tel.get('numero', ''))

        moveis = telefones.get('moveis', [])
        for i, tel in enumerate(moveis[:2]):  # Limitar a 2 celulares
            dados[f'Telefone_Celular_{i + 1}'] = limpar_telefone(tel.get('numero', ''))

        emails = resposta.get('emails', [])
        for i, email in enumerate(emails[:2]):  # Limitar a 2 emails
            dados[f'Email_{i + 1}'] = email.get('email', '')

        enderecos = resposta.get('enderecos', [])
        if enderecos:
            end = enderecos[0]  
            partes_endereco = []
            if end.get('bairro'):
                partes_endereco.append(end.get('bairro'))
            if end.get('cidade'):
                partes_endereco.append(end.get('cidade'))
            if end.get('uf'):
                partes_endereco.append(end.get('uf'))

            dados['Endereco'] = ", ".join(partes_endereco) if partes_endereco else ""
        else:
            dados['Endereco'] = ""

        socios = resposta.get('socios', [])
        for i, socio in enumerate(socios[:3]):  
            prefix = f'Socio_{i + 1}'
            dados[f'{prefix}_Nome'] = socio.get('nomeOuRazaoSocial', '')
            dados[f'{prefix}_CPF_CNPJ'] = limpar_cnpj(socio.get('documento', ''))
            dados[f'{prefix}_Data_Entrada'] = socio.get('dataEntrada', '')

    except Exception as e:
        logger.error(f"Erro ao processar dados CNPJ: {str(e)}")
        logger.debug(f"Resultado original: {resultado}")
        dados['Erro_Processamento'] = str(e)

    return dados


def extrair_dados_cpf(resultado):
    """
    Função para extrair e estruturar os dados do CPF retornados pela API
    """
    dados = {}

    try:
        # Extrair dados do cabeçalho
        if isinstance(resultado.get('cabecalho'), str):
            cabecalho = json.loads(resultado.get('cabecalho', '{}'))
        else:
            cabecalho = resultado.get('cabecalho', {})

        # Extrair dados da resposta
        if isinstance(resultado.get('resposta'), str):
            resposta = json.loads(resultado.get('resposta', '{}'))
        else:
            resposta = resultado.get('resposta', {})

        # Dados 
        dados_cadastrais = resposta.get('dadosCadastrais', {})
        dados['CPF'] = limpar_cnpj(dados_cadastrais.get('cpf', ''))

        dados['Nome'] = dados_cadastrais.get('nome', '')
        dados['Sexo'] = dados_cadastrais.get('sexo', '')
        dados['Data_Nascimento'] = dados_cadastrais.get('dataNascimento', '')
        dados['Idade'] = dados_cadastrais.get('idade', '')
        dados['RG'] = dados_cadastrais.get('rg', '')
        dados['UF_RG'] = dados_cadastrais.get('ufRg', '')
        dados['Situacao_Cadastral'] = dados_cadastrais.get('situacaoCadastral', '')
        dados['Nome_Mae'] = dados_cadastrais.get('maeNome', '')

        telefones = resposta.get('telefones', {})

        fixos = telefones.get('fixos', [])
        for i, tel in enumerate(fixos[:2]):
            dados[f'Telefone_Fixo_{i + 1}'] = limpar_telefone(tel.get('numero', ''))

        moveis = telefones.get('moveis', [])
        for i, tel in enumerate(moveis[:2]):
            dados[f'Telefone_Celular_{i + 1}'] = limpar_telefone(tel.get('numero', ''))

        enderecos = resposta.get('enderecos', [])
        if enderecos:
            end = enderecos[0]
            partes_endereco = []

            if end.get('bairro'):
                partes_endereco.append(end.get('bairro'))
            if end.get('cidade'):
                partes_endereco.append(end.get('cidade'))
            if end.get('uf'):
                partes_endereco.append(end.get('uf'))

            dados['Endereco'] = ", ".join(partes_endereco) if partes_endereco else ""
        else:
            dados['Endereco'] = ""

        # Emails
        emails = resposta.get('emails', [])
        for i, email in enumerate(emails[:2]):
            dados[f'Email_{i + 1}'] = email.get('email', '')

    except Exception as e:
        logger.error(f"Erro ao processar dados CPF: {str(e)}")
        logger.debug(f"Resultado original: {resultado}")
        dados['Erro_Processamento'] = str(e)

    return dados


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/consultar-cnpjs", methods=["POST"])
def consultar_cnpjs():
    data = request.json
    cnpjs = data.get("cnpjs", [])

    if not cnpjs:
        return jsonify({"erro": "Nenhum CNPJ enviado"}), 400

    resultados = []
    total = len(cnpjs)

    for i, cnpj in enumerate(cnpjs):
        inicio = time.time()
        resultado = consultar_cnpj(cnpj) or {}
        fim = time.time()

        tempo_consulta = round(fim - inicio, 2)
        progresso = round(((i + 1) / total) * 100, 1)

        resultado["cnpj"] = cnpj
        resultado["tempo_consulta"] = tempo_consulta
        resultado["progresso"] = progresso
        resultados.append(resultado)

        logger.info(f"Consultado CNPJ {cnpj} - Tempo: {tempo_consulta}s - Progresso: {progresso}%")

    return jsonify(resultados)


@app.route("/consultar-cpfs", methods=["POST"])
def consultar_cpfs():
    data = request.json
    cpfs = data.get("cpfs", [])
    id_finalidade = data.get("idFinalidade", 1)  # Padrão: Confirmação de identidade

    if not cpfs:
        return jsonify({"erro": "Nenhum CPF enviado"}), 400

    resultados = []
    total = len(cpfs)

    for i, cpf in enumerate(cpfs):
        inicio = time.time()
        resultado = consultar_cpf(cpf, id_finalidade) or {}
        fim = time.time()

        tempo_consulta = round(fim - inicio, 2)
        progresso = round(((i + 1) / total) * 100, 1)

        resultado["cpf"] = cpf
        resultado["tempo_consulta"] = tempo_consulta
        resultado["progresso"] = progresso
        resultados.append(resultado)

        logger.info(f"Consultado CPF {cpf} - Tempo: {tempo_consulta}s - Progresso: {progresso}%")

    return jsonify(resultados)


@app.route("/gerar-csv", methods=["POST"])
def gerar_csv():
    data = request.json
    tipo = data.get("tipo", "cnpj")  # Tipo de consulta: cnpj ou cpf
    documentos = data.get("documentos", [])
    id_finalidade = data.get("idFinalidade", 1)  

    if not documentos:
        return jsonify({"erro": "Nenhum documento enviado"}), 400

    resultados = []
    erros = []
    total = len(documentos)
    tempo_inicio_total = time.time()

    os.makedirs(CSV_DIR, exist_ok=True)

    logger.info(f"Iniciando processamento de {total} {tipo.upper()}(s) para CSV")

    for i, documento in enumerate(documentos):
        inicio = time.time()
        try:
            if tipo.lower() == "cnpj":
                resultado = consultar_cnpj(documento) or {}
                if resultado.get('erro'):
                    erros.append(f"{documento}: {resultado.get('erro')}")
                    logger.warning(f"Erro ao consultar CNPJ {documento}: {resultado.get('erro')}")
                    continue
                dados = extrair_dados_cnpj(resultado)
                resultados.append(dados)
            else:  # CPF
                resultado = consultar_cpf(documento, id_finalidade) or {}
                if resultado.get('erro'):
                    erros.append(f"{documento}: {resultado.get('erro')}")
                    logger.warning(f"Erro ao consultar CPF {documento}: {resultado.get('erro')}")
                    continue
                dados = extrair_dados_cpf(resultado)
                resultados.append(dados)

            fim = time.time()
            tempo_consulta = round(fim - inicio, 2)
            progresso = round(((i + 1) / total) * 100, 1)

            logger.info(f"Processado {tipo.upper()} {i + 1}/{total} ({progresso}%) - Tempo: {tempo_consulta}s")
        except Exception as e:
            logger.error(f"Erro ao processar {tipo.upper()} {documento}: {str(e)}")
            erros.append(f"{documento}: {str(e)}")

    tempo_total = round(time.time() - tempo_inicio_total, 2)
    logger.info(
        f"Processamento concluído em {tempo_total}s - {len(resultados)} registros processados, {len(erros)} erros")

    if not resultados:
        erro_msg = "Nenhum dado encontrado"
        if erros:
            erro_msg += f". Erros: {'; '.join(erros[:5])}"
            if len(erros) > 5:
                erro_msg += f" e mais {len(erros) - 5} erros"
        return jsonify({"erro": erro_msg}), 400

    try:
        df = pd.DataFrame(resultados)

        if df.empty:
            return jsonify({"erro": "Nenhum dado válido para gerar CSV"}), 400

        # Definir nome do arquivo com timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"resultados_{tipo}_{timestamp}.csv"
        file_path = os.path.join(CSV_DIR, file_name)

        df.to_csv(file_path, index=False, encoding='utf-8-sig', sep=';', float_format='%.0f')

        logger.info(f"Arquivo CSV gerado com sucesso: {file_path}")

        return jsonify({
            "mensagem": f"Arquivo CSV gerado com sucesso em {tempo_total}s",
            "arquivo": file_name,
            "tempo_total": tempo_total,
            "registros": len(resultados),
            "erros": len(erros)
        })

    except Exception as e:
        logger.error(f"Erro ao gerar CSV: {str(e)}")
        return jsonify({"erro": f"Erro ao gerar CSV: {str(e)}"}), 500


@app.route("/baixar-csv", methods=["GET"])
def baixar_csv():
    file_name = request.args.get("arquivo")

    if not file_name:
        return jsonify({"erro": "Nome do arquivo não especificado"}), 400

    # Verificar se o nome do arquivo é seguro (evitar path traversal)
    if '..' in file_name or '/' in file_name:
        logger.warning(f"Tentativa de acesso a arquivo não autorizado: {file_name}")
        return jsonify({"erro": "Nome de arquivo inválido"}), 400

    file_path = os.path.join(CSV_DIR, file_name)

    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        logger.warning(f"Arquivo não encontrado: {file_path}")
        return jsonify({"erro": "Arquivo CSV não encontrado"}), 404


# Rota para verificar status da API
@app.route("/status")
def status():
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "version": "1.1.0"
    })


# Tratamento de erros
@app.errorhandler(404)
def not_found(error):
    return jsonify({"erro": "Recurso não encontrado."}), 404


@app.errorhandler(500)
def server_error(error):
    logger.error(f"Erro interno do servidor: {str(error)}")
    return jsonify({"erro": "Erro interno do servidor."}), 500


if __name__ == "__main__":
    logger.info("Iniciando aplicação Flask...")
    # Para desenvolvimento local, habilitar o modo debug
    app.run(debug=True, host="0.0.0.0", port=5000)

