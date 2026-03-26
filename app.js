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
  const statusButton = document.getElementById("statusButton");
  const statusLast = document.getElementById("statusLast");
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

  async function fetchStatus(source = "http://localhost:8080") {
    log("Interrogation de /status ...");
    if (statusLast) statusLast.textContent = "Interrogation de /status ...";

    try {
      const response = await fetch(`${source}/status`, { method: "GET" });

      const contentType = response.headers.get("content-type") || "";
      let payload;
      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        payload = await response.text();
      }

      if (!response.ok) {
        const message =
          typeof payload === "string"
            ? payload
            : JSON.stringify(payload, null, 2);
        throw new Error(message || `HTTP error! status: ${response.status}`);
      }

      const rendered =
        typeof payload === "string"
          ? payload
          : JSON.stringify(payload, null, 2);

      if (statusLast) statusLast.innerHTML = `<pre style="white-space: pre-wrap; margin: 0">${rendered}</pre>`;
      log(`Retour /status : ${rendered}`);
    } catch (error) {
      if (statusLast) {
        statusLast.innerHTML = `<span class="error">Erreur /status : ${error.message}</span>`;
      }
      log(`Erreur /status : ${error.message}`);
    }
  }

  async function reconnectPrinter(source = "http://localhost:8080") {
    log("Tentative de reconnexion via /reconnect ...");
    if (statusLast) statusLast.textContent = "Tentative de reconnexion ...";

    try {
      const response = await fetch(`${source}/reconnect`, { method: "GET" });

      const contentType = response.headers.get("content-type") || "";
      let payload;
      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        payload = await response.text();
      }

      if (!response.ok) {
        const message =
          typeof payload === "string"
            ? payload
            : JSON.stringify(payload, null, 2);
        throw new Error(message || `HTTP error! status: ${response.status}`);
      }

      const rendered =
        typeof payload === "string"
          ? payload
          : JSON.stringify(payload, null, 2);

      if (statusLast)
        statusLast.innerHTML = `<pre style="white-space: pre-wrap; margin: 0">${rendered}</pre>`;
      log(`/reconnect: ${rendered}`);
    } catch (error) {
      if (statusLast) {
        statusLast.innerHTML = `<span class="error">Erreur /reconnect : ${error.message}</span>`;
      }
      log(`Erreur /reconnect : ${error.message}`);
    }
  }

  // ---- Device ----

  async function callDevice(path, method = "GET") {
    const source = "http://localhost:8080";
    log(`${method} ${path} ...`);
    const deviceResult = document.getElementById("deviceResult");
    try {
      const response = await fetch(`${source}${path}`, { method, headers: { "Content-Type": "application/json" } });
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await response.json() : await response.text();
      const rendered = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
      if (!response.ok) throw new Error(rendered);
      if (deviceResult) deviceResult.innerHTML = `<pre style="white-space:pre-wrap;margin:0">${rendered}</pre>`;
      log(`OK ${path} : ${rendered}`);
    } catch (err) {
      if (deviceResult) deviceResult.innerHTML = `<span class="error">Erreur ${path} : ${err.message}</span>`;
      log(`Erreur ${path} : ${err.message}`);
    }
  }

  // ---- Apps ----

  async function fetchAppsList(source = "http://localhost:8080") {
    log("GET /apps ...");
    const appsResult = document.getElementById("appsResult");
    try {
      const response = await fetch(`${source}/apps`, { method: "GET" });
      const payload = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(payload));
      const rendered = JSON.stringify(payload, null, 2);
      if (appsResult) appsResult.innerHTML = `<pre style="white-space:pre-wrap;margin:0">${rendered}</pre>`;
      log(`OK /apps : ${rendered}`);
    } catch (err) {
      if (appsResult) appsResult.innerHTML = `<span class="error">Erreur /apps : ${err.message}</span>`;
      log(`Erreur /apps : ${err.message}`);
    }
  }

  async function launchApp(query, source = "http://localhost:8080") {
    log(`POST /apps/launch query="${query}" ...`);
    const appsResult = document.getElementById("appsResult");
    try {
      const response = await fetch(`${source}/apps/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const payload = await response.json();
      const rendered = JSON.stringify(payload, null, 2);
      if (!response.ok) throw new Error(rendered);
      if (appsResult) appsResult.innerHTML = `<pre style="white-space:pre-wrap;margin:0">${rendered}</pre>`;
      log(`OK /apps/launch : ${rendered}`);
    } catch (err) {
      if (appsResult) appsResult.innerHTML = `<span class="error">Erreur /apps/launch : ${err.message}</span>`;
      log(`Erreur /apps/launch : ${err.message}`);
    }
  }

  // ---- Shell ----

  async function runShell(command, source = "http://localhost:8080") {
    log(`POST /shell command="${command}" ...`);
    const shellResult = document.getElementById("shellResult");
    try {
      const response = await fetch(`${source}/shell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const payload = await response.json();
      const rendered = JSON.stringify(payload, null, 2);
      if (!response.ok) throw new Error(rendered);
      if (shellResult) shellResult.innerHTML = `<pre style="white-space:pre-wrap;margin:0">${rendered}</pre>`;
      log(`OK /shell : ${rendered}`);
    } catch (err) {
      if (shellResult) shellResult.innerHTML = `<span class="error">Erreur /shell : ${err.message}</span>`;
      log(`Erreur /shell : ${err.message}`);
    }
  }

  // ---- Simulator ----

  async function fetchSimStates(source = "http://localhost:8080") {
    log("GET /simulator/states ...");
    const simResult = document.getElementById("simResult");
    try {
      const response = await fetch(`${source}/simulator/states`, { method: "GET" });
      const payload = await response.json();
      const rendered = JSON.stringify(payload, null, 2);
      if (!response.ok) throw new Error(rendered);
      if (simResult) simResult.innerHTML = `<pre style="white-space:pre-wrap;margin:0">${rendered}</pre>`;
      log(`OK /simulator/states : ${rendered}`);
    } catch (err) {
      if (simResult) simResult.innerHTML = `<span class="error">Erreur /simulator/states : ${err.message}</span>`;
      log(`Erreur /simulator/states : ${err.message}`);
    }
  }

  async function setSimState(state, source = "http://localhost:8080") {
    log(`POST /simulator/state state="${state}" ...`);
    const simResult = document.getElementById("simResult");
    try {
      const response = await fetch(`${source}/simulator/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      const payload = await response.json();
      const rendered = JSON.stringify(payload, null, 2);
      if (!response.ok) throw new Error(rendered);
      if (simResult) simResult.innerHTML = `<pre style="white-space:pre-wrap;margin:0">${rendered}</pre>`;
      log(`OK /simulator/state : ${rendered}`);
    } catch (err) {
      if (simResult) simResult.innerHTML = `<span class="error">Erreur /simulator/state : ${err.message}</span>`;
      log(`Erreur /simulator/state : ${err.message}`);
    }
  }

  ticketRadios.forEach((radio) => radio.addEventListener("change", updatePdfUrl));
  clearLogButton.addEventListener("click", clearLog);
  printButton.addEventListener("click", () => {
    printPDF();
  });
  statusButton?.addEventListener("click", () => {
    fetchStatus();
  });

  document.getElementById("deviceInfoButton")?.addEventListener("click", () => callDevice("/device/info", "GET"));
  document.getElementById("deviceHomeButton")?.addEventListener("click", () => callDevice("/device/home", "POST"));
  document.getElementById("deviceSettingsButton")?.addEventListener("click", () => callDevice("/device/settings", "POST"));

  document.getElementById("appsListButton")?.addEventListener("click", () => fetchAppsList());
  document.getElementById("appsLaunchButton")?.addEventListener("click", () => {
    const query = document.getElementById("appQuery")?.value.trim();
    if (query) launchApp(query);
  });

  document.getElementById("shellButton")?.addEventListener("click", () => {
    const command = document.getElementById("shellCommand")?.value.trim();
    if (command) runShell(command);
  });
  document.getElementById("shellCommand")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const command = e.target.value.trim();
      if (command) runShell(command);
    }
  });

  document.getElementById("simStatesButton")?.addEventListener("click", () => fetchSimStates());
  document.getElementById("simSetStateButton")?.addEventListener("click", () => {
    const state = document.getElementById("simStateSelect")?.value;
    if (state) setSimState(state);
  });

  updatePdfUrl();
  log("Site web charge et pret.");
  reconnectPrinter();
});
