document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const basePath = currentPath.endsWith("/")
    ? currentPath
    : `${currentPath.substring(0, currentPath.lastIndexOf("/") + 1)}`;
  const baseUrl = `${window.location.origin}${basePath}`;

  const ticketUrls = {
    default: `${baseUrl}ticket.pdf`,
    "no-margin": `${baseUrl}ticket_alt.pdf`,
    custom: "",
  };

  const pdfUrlInput = document.getElementById("pdfUrl");
  const logElement = document.getElementById("log");
  const pdfStatus = document.getElementById("pdfStatus");
  const clearLogButton = document.getElementById("clearLogButton");
  const printButton = document.getElementById("printButton");
  const ticketRadios = document.querySelectorAll('input[name="ticketSelect"]');

  function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    logElement.textContent += `[${timestamp}] ${message}\n`;
    logElement.scrollTop = logElement.scrollHeight;
  }

  function clearLog() {
    logElement.textContent = "";
  }

  function updatePdfUrl() {
    const selectedRadio = document.querySelector(
      'input[name="ticketSelect"]:checked'
    );

    if (!selectedRadio) {
      return;
    }

    const selectedTicket = selectedRadio.value;
    if (selectedTicket === "custom") {
      pdfUrlInput.value = "";
      pdfUrlInput.readOnly = false;
      pdfUrlInput.focus();
      return;
    }

    pdfUrlInput.value = ticketUrls[selectedTicket];
    pdfUrlInput.readOnly = true;
  }

  async function printPDF(source = "http://localhost:8080") {
    const pdfUrl = pdfUrlInput.value.trim();

    if (!pdfUrl) {
      pdfStatus.innerHTML = '<span class="error">Veuillez entrer une URL de PDF</span>';
      log("Erreur : Aucune URL de PDF fournie");
      return;
    }

    log(`Envoi de la demande d'impression PDF : ${pdfUrl}`);
    pdfStatus.textContent = "Envoi de la demande d'impression...";

    try {
      const response = await fetch(`${source}/print`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: pdfUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      pdfStatus.innerHTML =
        '<span class="success">Demande d\'impression PDF envoyée avec succès</span>';
      log("Demande d'impression PDF envoyee avec succes");

      if (result.message) {
        log(`Reponse du serveur : ${result.message}`);
      }
    } catch (error) {
      pdfStatus.innerHTML = `<span class="error">Erreur : ${error.message}</span>`;
      log(`Erreur d'impression PDF : ${error.message}`);
    }
  }

  ticketRadios.forEach((radio) => radio.addEventListener("change", updatePdfUrl));
  clearLogButton.addEventListener("click", clearLog);
  printButton.addEventListener("click", () => {
    printPDF();
  });

  updatePdfUrl();
  log("Site web charge et pret.");
});
