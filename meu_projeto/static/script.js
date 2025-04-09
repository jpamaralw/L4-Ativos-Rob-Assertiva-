// Configurações e constantes
const CONFIG = {
  MAX_HISTORICO_ITEMS: 10,
  STORAGE_KEY: "l4ativos_historico",
  API_BASE_URL: window.location.hostname === "localhost" ? "http://127.0.0.1:5000" : "",
  ANIMATION_DURATION: 300,
}

// Funções auxiliares
function parseDocumentos() {
  const documentosText = document.getElementById("documentos").value.trim()
  if (!documentosText) return []

  // Divide por vírgula ou quebra de linha
  const documentos = documentosText
    .split(/[\n,]+/)
    .map((doc) => doc.trim())
    .filter((doc) => doc.length > 0)

  return documentos
}

function validarDocumentos(documentos, tipo) {
  const regexCNPJ = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/
  const regexCPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/

  const regex = tipo === "cnpj" ? regexCNPJ : regexCPF
  const invalidos = []

  documentos.forEach((doc) => {
    if (!regex.test(doc)) {
      invalidos.push(doc)
    }
  })

  return invalidos
}

function showNotification(message, type = "info") {
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")
  const notificationIcon = document.getElementById("notification-icon")

  // Remover notificação existente para reiniciar animação
  notification.classList.add("hidden")

  setTimeout(() => {
    notificationMessage.textContent = message
    notification.className = `notification ${type}`
    notificationIcon.className = `notification-icon`
    notification.classList.remove("hidden")
  }, 10)

  // Auto-esconder após 5 segundos para notificações de sucesso
  if (type === "success") {
    setTimeout(hideNotification, 5000)
  }
}

function hideNotification() {
  const notification = document.getElementById("notification")
  notification.classList.add("hidden")
}

function setLoading(isLoading, message = "") {
  const loading = document.getElementById("loading")
  const loadingDetail = document.getElementById("loading-detail")
  const emptyState = document.getElementById("empty-state")
  const progressoContainer = document.getElementById("progresso-container")

  if (isLoading) {
    loading.classList.remove("hidden")
    emptyState.classList.add("hidden")
    if (message) {
      loadingDetail.textContent = message
      loadingDetail.classList.remove("hidden")
    } else {
      loadingDetail.classList.add("hidden")
    }
  } else {
    loading.classList.add("hidden")
    progressoContainer.classList.add("hidden")
  }
}

function atualizarProgresso(progresso, tempoConsulta, index, total) {
  const progressoContainer = document.getElementById("progresso-container")
  const progressoBarra = document.getElementById("progresso-barra")
  const progressoTexto = document.getElementById("progresso-texto")
  const tempoEstimado = document.getElementById("tempo-estimado")

  // Mostrar container de progresso
  progressoContainer.classList.remove("hidden")

  // Atualizar barra de progresso
  progressoBarra.style.width = `${progresso}%`

  // Atualizar texto de progresso
  progressoTexto.textContent = `${progresso}% (${index}/${total})`

  // Calcular tempo estimado restante
  if (index > 0 && tempoConsulta > 0) {
    const tempoMedio = tempoConsulta // Tempo da última consulta
    const restantes = total - index
    const tempoRestanteEstimado = Math.round(tempoMedio * restantes)

    if (tempoRestanteEstimado > 0) {
      tempoEstimado.textContent = `Tempo restante estimado: ${formatarTempo(tempoRestanteEstimado)}`
    }
  }
}

function formatarTempo(segundos) {
  if (segundos < 60) {
    return `${segundos} seg`
  } else if (segundos < 3600) {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos} min ${segs} seg`
  } else {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    return `${horas} h ${minutos} min`
  }
}

function formatarDocumento(doc, tipo) {
  // Remove caracteres não numéricos
  const numeros = doc.replace(/\D/g, "")

  if (tipo === "cnpj") {
    if (numeros.length !== 14) return doc // Retorna original se não tiver 14 dígitos
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`
  } else {
    // CPF
    if (numeros.length !== 11) return doc // Retorna original se não tiver 11 dígitos
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`
  }
}

function displayResults(data, tipoConsulta) {
  const resultadosElement = document.getElementById("resultados")
  const tableResultadosElement = document.getElementById("table-resultados")
  const emptyState = document.getElementById("empty-state")

  if (data && data.length > 0) {
    // Exibir como JSON formatado com syntax highlighting
    const jsonFormatado = JSON.stringify(data, null, 2)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
      .replace(/"([^"]+)"/g, '<span class="json-string">"$1"</span>')
      .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="json-number">$1</span>')

    resultadosElement.innerHTML = jsonFormatado

    // Exibir como tabela
    let tableHtml = "<table><thead><tr>"

    // Cabeçalhos diferentes para CNPJ e CPF
    if (tipoConsulta === "cnpj") {
      tableHtml += "<th>CNPJ</th><th>Razão Social</th><th>Nome Fantasia</th><th>Situação</th><th>Tempo (s)</th>"
    } else {
      tableHtml += "<th>CPF</th><th>Nome</th><th>Situação</th><th>Tempo (s)</th>"
    }

    tableHtml += "</tr></thead><tbody>"

    data.forEach((item) => {
      if (tipoConsulta === "cnpj") {
        const dadosCadastrais = item.resposta?.dadosCadastrais || {}
        tableHtml += `<tr>
                    <td>${formatarDocumento(item.cnpj || "-", "cnpj")}</td>
                    <td>${dadosCadastrais.razaoSocial || "-"}</td>
                    <td>${dadosCadastrais.nomeFantasia || "-"}</td>
                    <td>${dadosCadastrais.situacaoCadastral || "-"}</td>
                    <td>${item.tempo_consulta || "-"}</td>
                </tr>`
      } else {
        const dadosCadastrais = item.resposta?.dadosCadastrais || {}
        tableHtml += `<tr>
                    <td>${formatarDocumento(item.cpf || "-", "cpf")}</td>
                    <td>${dadosCadastrais.nome || "-"}</td>
                    <td>${dadosCadastrais.situacaoCadastral || "-"}</td>
                    <td>${item.tempo_consulta || "-"}</td>
                </tr>`
      }
    })

    tableHtml += "</tbody></table>"
    tableResultadosElement.innerHTML = tableHtml

    emptyState.classList.add("hidden")

    // Adicionar ao histórico
    adicionarAoHistorico(tipoConsulta, data)
  } else {
    resultadosElement.textContent = "Nenhum resultado encontrado."
    tableResultadosElement.innerHTML = "<p>Nenhum resultado encontrado.</p>"
    emptyState.classList.remove("hidden")
  }
}

// Funções de histórico
function adicionarAoHistorico(tipo, data) {
  // Obter histórico atual
  let historico = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || "[]")

  // Criar novo item
  const novoItem = {
    id: Date.now(),
    tipo: tipo,
    data: new Date().toISOString(),
    documentos: tipo === "cnpj" ? data.map((item) => item.cnpj) : data.map((item) => item.cpf),
    resumo:
      tipo === "cnpj"
        ? data.map((item) => item.resposta?.dadosCadastrais?.razaoSocial || "Sem nome").slice(0, 3)
        : data.map((item) => item.resposta?.dadosCadastrais?.nome || "Sem nome").slice(0, 3),
  }

  // Adicionar ao início do array
  historico.unshift(novoItem)

  // Limitar tamanho do histórico
  if (historico.length > CONFIG.MAX_HISTORICO_ITEMS) {
    historico = historico.slice(0, CONFIG.MAX_HISTORICO_ITEMS)
  }

  // Salvar no localStorage
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(historico))

  // Atualizar UI
  atualizarHistoricoUI()
}

function atualizarHistoricoUI() {
  const historicoLista = document.getElementById("historico-lista")
  const historicoContainer = document.getElementById("historico-container")

  // Obter histórico
  const historico = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || "[]")

  if (historico.length === 0) {
    historicoContainer.classList.add("hidden")
    return
  }

  // Mostrar container
  historicoContainer.classList.remove("hidden")

  // Limpar lista atual
  historicoLista.innerHTML = ""

  // Adicionar itens
  historico.forEach((item) => {
    const dataFormatada = new Date(item.data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })

    const resumoTexto = item.resumo.join(", ")
    const qtdDocs = item.documentos.length

    const itemElement = document.createElement("div")
    itemElement.className = "historico-item"
    itemElement.innerHTML = `
            <div class="historico-item-texto">
                ${item.tipo.toUpperCase()}: ${resumoTexto}${qtdDocs > 3 ? ` e mais ${qtdDocs - 3}` : ""}
            </div>
            <div class="historico-item-data">${dataFormatada}</div>
        `

    // Adicionar evento de clique
    itemElement.addEventListener("click", () => {
      carregarDoHistorico(item)
    })

    historicoLista.appendChild(itemElement)
  })
}

function carregarDoHistorico(item) {
  // Selecionar o tipo correto
  const radioButtons = document.querySelectorAll('input[name="tipo-consulta"]')
  radioButtons.forEach((radio) => {
    if (radio.value === item.tipo) {
      radio.checked = true
      // Disparar evento change para atualizar a UI
      radio.dispatchEvent(new Event("change"))
    }
  })

  // Preencher textarea
  const documentosTextarea = document.getElementById("documentos")
  documentosTextarea.value = item.documentos.join("\n")

  // Mostrar notificação
  showNotification(`Carregados ${item.documentos.length} ${item.tipo.toUpperCase()}(s) do histórico`, "info")
}

// Função para consultar documentos
async function consultarDocumentos() {
  const tipoConsulta = document.querySelector('input[name="tipo-consulta"]:checked').value
  const documentos = parseDocumentos()

  if (documentos.length === 0) {
    showNotification(`Por favor, insira pelo menos um ${tipoConsulta.toUpperCase()}`, "error")
    return
  }

  // Validar documentos
  const invalidos = validarDocumentos(documentos, tipoConsulta)
  if (invalidos.length > 0) {
    const mensagem =
      invalidos.length === 1
        ? `O documento "${invalidos[0]}" parece inválido. Verifique o formato.`
        : `${invalidos.length} documentos parecem inválidos. Verifique o formato.`
    showNotification(mensagem, "warning")
    // Continuar mesmo com documentos inválidos
  }

  setLoading(true, `Consultando ${documentos.length} ${tipoConsulta.toUpperCase()}(s)...`)
  hideNotification()

  try {
    let endpoint = ""
    let payload = {}

    if (tipoConsulta === "cnpj") {
      endpoint = `${CONFIG.API_BASE_URL}/consultar-cnpjs`
      payload = { cnpjs: documentos }
    } else {
      endpoint = `${CONFIG.API_BASE_URL}/consultar-cpfs`
      const idFinalidade = document.getElementById("finalidade").value
      payload = { cpfs: documentos, idFinalidade: Number.parseInt(idFinalidade) }
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (response.ok) {
      displayResults(data, tipoConsulta)

      // Calcular tempo total
      let tempoTotal = 0
      data.forEach((item) => {
        if (item.tempo_consulta) {
          tempoTotal += item.tempo_consulta
        }
      })

      showNotification(
        `${data.length} ${tipoConsulta.toUpperCase()}(s) consultados com sucesso em ${tempoTotal.toFixed(1)}s!`,
        "success",
      )

      // Atualizar progresso para cada item
      data.forEach((item, index) => {
        if (item.progresso && item.tempo_consulta) {
          atualizarProgresso(item.progresso, item.tempo_consulta, index + 1, documentos.length)
        }
      })
    } else {
      showNotification(`Erro: ${data.erro || "Falha na consulta"}`, "error")
    }
  } catch (error) {
    showNotification(`Erro ao consultar: ${error.message || "Erro desconhecido"}`, "error")
    console.error("Erro:", error)
  } finally {
    setLoading(false)
  }
}

// Função para gerar CSV
async function gerarCsv() {
  const tipoConsulta = document.querySelector('input[name="tipo-consulta"]:checked').value
  const documentos = parseDocumentos()

  if (documentos.length === 0) {
    showNotification(`Por favor, insira pelo menos um ${tipoConsulta.toUpperCase()}`, "error")
    return
  }

  // Validar documentos
  const invalidos = validarDocumentos(documentos, tipoConsulta)
  if (invalidos.length > 0) {
    const mensagem =
      invalidos.length === 1
        ? `O documento "${invalidos[0]}" parece inválido. Verifique o formato.`
        : `${invalidos.length} documentos parecem inválidos. Verifique o formato.`
    showNotification(mensagem, "warning")
    // Continuar mesmo com documentos inválidos
  }

  setLoading(true, `Gerando CSV para ${documentos.length} ${tipoConsulta.toUpperCase()}(s)...`)
  hideNotification()

  try {
    const payload = { tipo: tipoConsulta, documentos: documentos }

    // Adicionar finalidade para CPF
    if (tipoConsulta === "cpf") {
      const idFinalidade = document.getElementById("finalidade").value
      payload.idFinalidade = Number.parseInt(idFinalidade)
    }

    // Gerar o CSV no backend
    const response = await fetch(`${CONFIG.API_BASE_URL}/gerar-csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok || data.erro) {
      showNotification("Erro ao gerar CSV: " + (data.erro || "Falha na requisição"), "error")
      return
    }

    // Criar um link para baixar o CSV
    const downloadLink = document.createElement("a")
    downloadLink.href = `${CONFIG.API_BASE_URL}/baixar-csv?arquivo=${data.arquivo}`
    downloadLink.download = data.arquivo
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    showNotification(`Download iniciado! Processamento concluído em ${data.tempo_total}s`, "success")
  } catch (error) {
    showNotification(`Erro ao gerar CSV: ${error.message || "Erro desconhecido"}`, "error")
    console.error("Erro:", error)
  } finally {
    setLoading(false)
  }
}

// Configuração das abas
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab")

      // Atualizar botões
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Atualizar conteúdo
      tabContents.forEach((content) => content.classList.remove("active"))
      document.getElementById(`${tabName}-tab`).classList.add("active")
    })
  })
}

// Configuração do botão de fechar notificação
function setupNotificationClose() {
  const closeButton = document.getElementById("notification-close")
  if (closeButton) {
    closeButton.addEventListener("click", hideNotification)
  }
}

// Configuração dos botões
function setupButtons() {
  const consultarBtn = document.getElementById("consultar-btn")
  const gerarCsvBtn = document.getElementById("gerar-csv-btn")

  if (consultarBtn) {
    consultarBtn.addEventListener("click", consultarDocumentos)
  }

  if (gerarCsvBtn) {
    gerarCsvBtn.addEventListener("click", gerarCsv)
  }

  // Adicionar atalhos de teclado
  document.addEventListener("keydown", (e) => {
    // Ctrl+Enter para consultar
    if (e.ctrlKey && e.key === "Enter") {
      consultarDocumentos()
    }

    // Ctrl+S para gerar CSV
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault() // Prevenir o comportamento padrão de salvar a página
      gerarCsvBtn.click()
    }
  })
}

// Configuração do tipo de consulta
function setupTipoConsulta() {
  const radioButtons = document.querySelectorAll('input[name="tipo-consulta"]')
  const descricaoConsulta = document.getElementById("descricao-consulta")
  const opcoesCpf = document.getElementById("opcoes-cpf")
  const documentosTextarea = document.getElementById("documentos")

  radioButtons.forEach((radio) => {
    radio.addEventListener("change", () => {
      const tipoConsulta = radio.value

      if (tipoConsulta === "cnpj") {
        descricaoConsulta.textContent = "Digite ou cole os CNPJs separados por vírgula ou linha"
        documentosTextarea.placeholder = "Ex: 00.000.000/0001-00, 11.111.111/0001-11..."
        opcoesCpf.classList.add("hidden")
      } else {
        descricaoConsulta.textContent = "Digite ou cole os CPFs separados por vírgula ou linha"
        documentosTextarea.placeholder = "Ex: 123.456.789-01, 987.654.321-09..."
        opcoesCpf.classList.remove("hidden")
      }
    })
  })
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  setupTabs()
  setupNotificationClose()
  setupButtons()
  setupTipoConsulta()
  atualizarHistoricoUI()

  // Adicionar favicon se não existir
  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement("link")
    favicon.rel = "icon"
    favicon.type = "image/png"
    favicon.href =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABJBJREFUWEe9l21sU2UUx//PbdfSrh0dG2yDjTFgEwEJH0QREz9INCaKiYmJJiYavxgTDUEwUeOLJn4wfiAxRhM1xkTji9FEE40aE6MJL2rAKBoRZBsyvpTBYGPdWruu9zGnvb3t7e0G6hfOl+09z3n+v3Oe85znXMIcr6bj7pKCQlsNUbSGmFcx0UIAJQBcAKIABhkYYKJeYj7HhFNe/8qzc3EtTXdT0/HqKFfeRsDbALgBZPKjAOAHsJ+Jd3v9/l9nBdB0tKYc+e5dAN4EUDjTQ1P2hwE+COBTb+PKvmkBmg7XlCPP/RmAF2cLnLDfD+ADb2PlkbQAjfs2vkYRfg9Aaa7gCbujIOyIVK/9Ni1Aw4G6pUyRbgDFuQQQe0MgbPC2rDqXFqD+QN0SZjoJoCTXAGJ/CMTrvC2rzmcEaNhfV8+Mo3MBIHQwY423tfpcRgD9QN1eZmzNNYDQZ8ZH3tbqbRkB6vbXHQSwKdcAQp8ZB7xt1ZvSAtTuq60iohMACnIJkKQLmLG6o736z7QA9Xt3FEbdkV4AxbkCSNEbZOKqzs7NodQYMCZhw/7dHzLj3VwBpOox+KOO9g1/pAVo2FtXy0RHAdhyAZCqw4xIJFJVc/r0Zn9KDMQBdtfVMPFRALZsA6TRCzNxdWfnxuOZATbXbmPCnmwDpNFjwJva7Zt+TQvQsLvuFSb+OpsAGXRe1bZv+iUtQP3uujIi7gVQlC2ADHr9zLyyvX3L5bQA+vbdnzDwdrYAMuh8qm3f/H5GgIZddRuYcDgbAJl0mLHe2775SEaA+l11S5moC4BrrgEy6AwxcVVH+5YLaQGa9u0oCEf4LwBL5hIgjQ4z0cqOji2DaQHEZuPO2veI8OFcAqTTYcZH2o4tOzMC6LtqX2TGT3MFkEmHCS9pO7cezgjQuHNHMUf4AoDyuQDIpMPAZSZe1tW1NZgWQGw2/lD7DTNenmuANDqnwLxO6976a1qA+h9rq5lwLCcAKTpMvE7bu/X7jAD1P9TuZMa2XAGk6jBwgBmv6/dsO5sRoO77mgomnJprgBQdZuLlXfu2X0oL0Lx/uzMUCPcBKMsVQIpeiBmVXfu3D2UE0L+vfYsZX+QKIFU+Mn/Y9eP2XRkB9O9qFzPxWQDObAOk0QsxY2nXT9v7MgI0f7fDFQqGLgAozSZABp0QmJd2/bxjICOA/m3tOmYcyyZAJh1mXtf1y46fMwLoB2pfYMKxbAFk0mHGC13tO37KCFD3TY2HiM8DKJhrAKE/xIxFXQd3XkwL0HJou53Hvb0AFuQCQOgy8aKuQ7v60wI0H9xeGg3zRQDzcwEg9Jh4YdfhXZfTArQc3O4Oh/kygHm5ABB6TDy/6/CuK2kBWg5sc0fCPABgbsYAA1fAvKDryK6htAAtB7a6I2EeBDAvmwBC9yqYK7qO7hpOC9ByYEtxJBIZAlCUTQChO8LMC7uP7RlJCdLEZsvXW/Kj0ehVAIXZBBC6I8xcceL4nmBKHCQAtHy1xRGNRoMAHNkEELrDzFx+4sSe8WQA8ef/AEiQZRPUjtSsAAAAAElFTkSuQmCC"
    document.head.appendChild(favicon)
  }

  console.log("Script carregado e inicializado com sucesso!")
})

