import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getContractTemplateHTML, defaultClauses } from './contractTemplate.js';
import { servicesData, nicheTemplates } from './servicesData.js';

// Estado da Aplicação
const defaultProposalState = {
  clientName: "Cliente Exemplo",
  projectName: "Aceleração de Performance Digital",
  validityDays: 15,
  niche: "ecommerce",
  nicheName: "E-commerce & Varejo Digital",
  customPainPoints: [...nicheTemplates.ecommerce.painPoints],
  customStrategy: nicheTemplates.ecommerce.strategy,
  contractTerm: "Aviso prévio de 30 dias",
  paymentTerms: "Faturamento mensal via boleto, Pix ou cartão de crédito. Primeira mensalidade em D+7 após a assinatura do contrato.",
  setupPaymentTerms: "Parcelamento em até 6x sem juros.",
  mediaInvestment: "R$ 2.000,00 a R$ 5.000,00 / mês",
  workStart: "D+10 dias após assinatura contratual.",
  proposalNotes: "",
  selectedServices: [], // Array de { categoryId, serviceId, levelId, name, price, description, period, recurring }
  overrideMonthly: null,
  overrideOneOffAndSetup: null,
  discountMonthly: null,
  discountOneOff: null,
  includeSlides: {
    cover: true,
    problem: true,
    testimonials: true,
    portfolio_web: true,
    portfolio_social: true,
    method: true,
    services: true,
    investment: true,
    logos: true
  },
  // Contract specific fields
  contractCompany: "",
  contractCNPJ: "",
  contractPhone: "",
  contractAddress: "",
  contractRepName: "",
  contractRepEmail: "",
  contractDueDayRec: 5,
  contractPaymentRec: "Boleto bancário",
  contractPaymentSetup: "Pix",
  contractSetupInstallments: 6,
  contractStartDate: "",
  contractClauses: null,
  customGuidelines: {}
};

let proposalState = JSON.parse(JSON.stringify(defaultProposalState));

// Inicialização da UI
document.addEventListener("DOMContentLoaded", () => {
  renderNicheOptions();
  loadSavedState(); // Carrega o tema e estado salvos
  renderServicesSelector();
  rebuildActiveServiceCardsFromState();
  setupEventListeners();

  // Set default contract start date to today if empty
  if (!proposalState.contractStartDate) {
    const today = new Date().toISOString().split("T")[0];
    proposalState.contractStartDate = today;
    const dateInput = document.getElementById("contract-start-date-input");
    if (dateInput) dateInput.value = today;
  }

  // Se não houver estado salvo, executa o sincronismo de nicho inicial padrão
  if (!localStorage.getItem("rakta_proposal_state")) {
    syncNicheFields();
  } else {
    syncFieldsFromState();
  }
  loadGeminiApiKey();
  populateClauseSelect();
  updatePreview();
});

// Renderiza os campos de nicho no select
function renderNicheOptions() {
  const nicheSelect = document.getElementById("niche-select");
  nicheSelect.innerHTML = "";
  for (const [key, niche] of Object.entries(nicheTemplates)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = niche.name;
    nicheSelect.appendChild(option);
  }
}

// Agrupa serviços em Recorrentes e Pontuais para uso global
function getGroupedServices() {
  const grouped = {
    recorrente: {
      title: "Serviços Recorrentes (Mensais)",
      categories: {}
    },
    pontual: {
      title: "Serviços Pontuais (Projetos & Setups)",
      categories: {}
    }
  };

  for (const [catId, category] of Object.entries(servicesData)) {
    category.services.forEach(service => {
      const firstLevelKey = Object.keys(service.levels)[0];
      const period = service.levels[firstLevelKey].period;
      const type = period === "mês" ? "recorrente" : "pontual";

      if (!grouped[type].categories[catId]) {
        grouped[type].categories[catId] = {
          title: category.title,
          services: []
        };
      }
      grouped[type].categories[catId].services.push(service);
    });
  }
  return grouped;
}

// Cria os controles de serviço dinamicamente (Option A - Dynamic Add)
function renderServicesSelector() {
  const container = document.getElementById("services-accordion");
  container.innerHTML = "";

  const grouped = getGroupedServices();

  for (const [groupId, group] of Object.entries(grouped)) {
    const catCard = document.createElement("div");
    catCard.className = "accordion-category";

    let categoriesHTML = "";
    for (const [catId, category] of Object.entries(group.categories)) {
      categoriesHTML += `
        <div class="subcategory-block" style="margin-bottom: 18px; border-left: 2px solid rgba(255,255,255,0.06); padding-left: 12px; margin-top: 10px;">
          <h5 style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.05em;">${category.title}</h5>
          <div class="mb-2">
            <select class="add-service-select input-field" data-cat="${catId}" data-group="${groupId}" style="padding: 8px 12px; font-size: 12px;">
              <!-- Populado dinamicamente -->
            </select>
          </div>
          <div class="active-services-list" id="active-list-${groupId}-${catId}">
            <!-- Cards de serviços ativos adicionados aqui -->
          </div>
        </div>
      `;
    }

    catCard.innerHTML = `
      <div class="accordion-header flex justify-between items-center cursor-pointer">
        <h4>${group.title}</h4>
        <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
      </div>
      <div class="accordion-content hidden" style="padding: 10px 16px 16px 16px;">
        ${categoriesHTML}
      </div>
    `;

    container.appendChild(catCard);

    // Popula os seletores iniciais para esta categoria no grupo
    for (const catId of Object.keys(group.categories)) {
      updateDropdownOptions(groupId, catId);
    }
  }

  // Configura listeners para todos os selects criados
  container.querySelectorAll(".add-service-select").forEach(select => {
    select.addEventListener("change", (e) => {
      const serviceId = e.target.value;
      const catId = e.target.dataset.cat;
      const groupId = e.target.dataset.group;

      if (serviceId) {
        addServiceCard(catId, serviceId, groupId);
        e.target.value = ""; // Reseta o select
      }
    });
  });

  // Lógica de toggle do Accordion
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      const icon = header.querySelector(".accordion-icon");
      content.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });
  });
}

// Popula o dropdown de serviços ocultando os já adicionados
function updateDropdownOptions(groupId, catId) {
  const select = document.querySelector(`.add-service-select[data-cat="${catId}"][data-group="${groupId}"]`);
  if (!select) return;

  const grouped = getGroupedServices();
  const category = grouped[groupId].categories[catId];
  if (!category) return;

  const activeList = document.getElementById(`active-list-${groupId}-${catId}`);
  const activeIds = activeList ? Array.from(activeList.querySelectorAll(".service-card-active")).map(el => el.dataset.service) : [];

  let optionsHTML = `<option value="">+ Adicionar em ${category.title}...</option>`;
  category.services.forEach(service => {
    if (!activeIds.includes(service.id)) {
      optionsHTML += `<option value="${service.id}">${service.name}</option>`;
    }
  });

  select.innerHTML = optionsHTML;
}

// Adiciona um card de serviço ativo para customização
function addServiceCard(catId, serviceId, groupId) {
  const activeList = document.getElementById(`active-list-${groupId}-${catId}`);
  if (!activeList) return;

  const category = servicesData[catId];
  const service = category.services.find(s => s.id === serviceId);
  const firstLevelKey = Object.keys(service.levels)[0];
  const defaultLevel = service.levels[firstLevelKey];

  // Opções de níveis para o select
  let levelOptions = "";
  Object.keys(service.levels).forEach(levelKey => {
    const level = service.levels[levelKey];
    levelOptions += `<option value="${levelKey}">${level.name}</option>`;
  });

  const card = document.createElement("div");
  card.className = "service-card-active";
  card.dataset.cat = catId;
  card.dataset.service = serviceId;
  card.innerHTML = `
    <div class="service-card-header">
      <span class="service-card-title">${service.name}</span>
      <button type="button" class="btn-remove-service" title="Remover Serviço">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
    <div class="service-card-details">
      <div class="grid grid-cols-2 gap-4 mb-2">
        <div>
          <label class="text-[10px] uppercase font-bold text-zinc-500">Nível</label>
          <select class="service-level-select input-field" data-cat="${catId}" data-service="${serviceId}">
            ${levelOptions}
          </select>
        </div>
        <div>
          <label class="text-[10px] uppercase font-bold text-zinc-500">Preço Principal (R$)</label>
          <input type="number" class="service-price-input input-field" data-cat="${catId}" data-service="${serviceId}" value="${defaultLevel.price}">
        </div>
      </div>
      ${defaultLevel.recurring !== undefined ? `
      <div class="mb-2">
        <label class="text-[10px] uppercase font-bold text-zinc-500">Mensalidade CRM/Chatbot (R$)</label>
        <input type="number" class="service-recurring-input input-field" data-cat="${catId}" data-service="${serviceId}" value="${defaultLevel.recurring}">
      </div>
      ` : ""}
      <div class="mb-2" style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" class="service-bonus-checkbox" id="bonus-${serviceId}" data-cat="${catId}" data-service="${serviceId}" style="width: 14px; height: 14px; cursor: pointer;">
        <label for="bonus-${serviceId}" style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); cursor: pointer; user-select: none; margin-bottom: 0;">Marcar como Bônus</label>
      </div>
      <div class="mb-2">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <label class="text-[10px] uppercase font-bold text-zinc-500" style="margin-bottom: 0;">Escopo da Entrega</label>
          <button type="button" class="btn-optimize-single-service" data-cat="${catId}" data-service="${serviceId}" style="background: none; border: none; color: var(--rakta-red); font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; transition: all 0.2s;" title="Otimizar este escopo com IA">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Otimizar
          </button>
        </div>
        <textarea class="service-desc-input input-field text-xs" data-cat="${catId}" data-service="${serviceId}" rows="3">${defaultLevel.description}</textarea>
      </div>
    </div>
  `;

  activeList.appendChild(card);

  // Seletores de elementos do card
  const levelSelect = card.querySelector(".service-level-select");
  const priceInput = card.querySelector(".service-price-input");
  const descInput = card.querySelector(".service-desc-input");
  const recInput = card.querySelector(".service-recurring-input");
  const btnRemove = card.querySelector(".btn-remove-service");
  const btnOptimizeSingle = card.querySelector(".btn-optimize-single-service");

  // Listener do botão de otimização de IA individual
  if (btnOptimizeSingle) {
    btnOptimizeSingle.addEventListener("click", () => {
      optimizeSingleService(catId, serviceId, btnOptimizeSingle);
    });
  }

  // Listener para troca de nível
  levelSelect.addEventListener("change", (e) => {
    const selectedLevelKey = e.target.value;
    const selectedLevel = service.levels[selectedLevelKey];
    priceInput.value = selectedLevel.price;
    descInput.value = selectedLevel.description;
    if (recInput) {
      recInput.value = selectedLevel.recurring || 0;
    }
    syncSelectedServices();
    updatePreview();
  });

  // Listeners para digitação direta nos campos
  priceInput.addEventListener("input", () => { syncSelectedServices(); updatePreviewDebounced(); });
  descInput.addEventListener("input", () => { syncSelectedServices(); updatePreviewDebounced(); });
  if (recInput) {
    recInput.addEventListener("input", () => { syncSelectedServices(); updatePreviewDebounced(); });
  }

  const bonusCheckbox = card.querySelector(".service-bonus-checkbox");
  if (bonusCheckbox) {
    bonusCheckbox.addEventListener("change", () => {
      syncSelectedServices();
      updatePreview();
    });
  }

  // Listener para o botão de remoção
  btnRemove.addEventListener("click", () => {
    card.remove();
    updateDropdownOptions(groupId, catId);
    syncSelectedServices();
    updatePreview();
  });

  // Atualiza as opções do dropdown e sincroniza o estado global
  updateDropdownOptions(groupId, catId);
  syncSelectedServices();
  updatePreview();
}

// Configura os ouvintes de eventos da UI
function setupEventListeners() {
  // Abas de Modo (Proposta vs Contrato)
  const tabProposal = document.getElementById("tab-proposal");
  const tabContract = document.getElementById("tab-contract");
  const sidebarProposal = document.getElementById("sidebar-proposal-content");
  const sidebarContract = document.getElementById("sidebar-contract-content");
  const headerProposal = document.getElementById("proposal-preview-header");
  const headerContract = document.getElementById("contract-preview-header");
  const previewSlides = document.getElementById("slides-preview");
  const previewContract = document.getElementById("contract-preview");
  const btnDownloadPdf = document.getElementById("btn-download-pdf");
  const btnPrintContract = document.getElementById("btn-print-contract");

  if (tabProposal && tabContract) {
    tabProposal.addEventListener("click", () => {
      tabProposal.classList.add("active");
      tabContract.classList.remove("active");
      sidebarProposal.classList.remove("hidden");
      sidebarContract.classList.add("hidden");
      headerProposal.classList.remove("hidden");
      headerContract.classList.add("hidden");
      previewSlides.classList.remove("hidden");
      previewContract.classList.add("hidden");
      btnDownloadPdf.classList.remove("hidden");
      btnPrintContract.classList.add("hidden");

      updateSlideScale();
    });

    tabContract.addEventListener("click", () => {
      tabContract.classList.add("active");
      tabProposal.classList.remove("active");
      sidebarContract.classList.remove("hidden");
      sidebarProposal.classList.add("hidden");
      headerContract.classList.remove("hidden");
      headerProposal.classList.add("hidden");
      previewContract.classList.remove("hidden");
      previewSlides.classList.add("hidden");
      btnPrintContract.classList.remove("hidden");
      btnDownloadPdf.classList.add("hidden");

      // Auto-populate company name with client name if empty
      if (!proposalState.contractCompany && proposalState.clientName) {
        proposalState.contractCompany = proposalState.clientName;
        const compInput = document.getElementById("contract-company-input");
        if (compInput) compInput.value = proposalState.clientName;
      }

      populateClauseSelect();
      updateContractPreview();
    });
  }

  // Eventos de inputs do Contrato
  const addContractListener = (id, prop, isNumber = false) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", (e) => {
        proposalState[prop] = isNumber ? (parseFloat(e.target.value) || 0) : e.target.value;
        saveToLocalStorage();
        updateContractPreview();
      });
      el.addEventListener("change", (e) => {
        proposalState[prop] = isNumber ? (parseFloat(e.target.value) || 0) : e.target.value;
        saveToLocalStorage();
        updateContractPreview();
      });
    }
  };

  addContractListener("contract-company-input", "contractCompany");
  addContractListener("contract-cnpj-input", "contractCNPJ");
  addContractListener("contract-phone-input", "contractPhone");
  addContractListener("contract-address-input", "contractAddress");
  addContractListener("contract-rep-name-input", "contractRepName");
  addContractListener("contract-rep-email-input", "contractRepEmail");
  addContractListener("contract-due-day-rec-input", "contractDueDayRec", true);
  addContractListener("contract-payment-rec-select", "contractPaymentRec");
  addContractListener("contract-payment-setup-select", "contractPaymentSetup");
  addContractListener("contract-setup-installments-input", "contractSetupInstallments", true);
  addContractListener("contract-start-date-input", "contractStartDate");

  // Formatador automático de CNPJ no input
  const cnpjInput = document.getElementById("contract-cnpj-input");
  if (cnpjInput) {
    cnpjInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 14) value = value.substring(0, 14);

      if (value.length > 12) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      } else if (value.length > 8) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
      } else if (value.length > 5) {
        value = value.replace(/^(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
      } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{1,3})/, "$1.$2");
      }
      e.target.value = value;
      proposalState.contractCNPJ = value;
      saveToLocalStorage();
    });
  }

  // Botões de impressão do contrato
  const btnPrintContractSidebar = document.getElementById("btn-print-contract");
  const btnPrintContractTop = document.getElementById("btn-print-contract-top");

  if (btnPrintContractSidebar) {
    btnPrintContractSidebar.addEventListener("click", printContract);
  }
  if (btnPrintContractTop) {
    btnPrintContractTop.addEventListener("click", printContract);
  }

  // Inputs básicos
  document.getElementById("client-name-input").addEventListener("input", (e) => {
    proposalState.clientName = e.target.value || "Cliente Exemplo";
    updatePreviewDebounced();
  });

  document.getElementById("project-name-input").addEventListener("input", (e) => {
    proposalState.projectName = e.target.value || "Aceleração de Performance Digital";
    updatePreviewDebounced();
  });

  document.getElementById("validity-input").addEventListener("input", (e) => {
    proposalState.validityDays = parseInt(e.target.value) || 15;
    updatePreviewDebounced();
  });

  // Nicho
  document.getElementById("niche-select").addEventListener("change", (e) => {
    proposalState.niche = e.target.value;
    syncNicheFields();
    updatePreview();
  });

  document.getElementById("niche-name-input").addEventListener("input", (e) => {
    proposalState.nicheName = e.target.value || "";
    updatePreviewDebounced();
  });

  // Editor de dores e estratégia
  document.getElementById("pain-points-editor").addEventListener("input", () => {
    const val = document.getElementById("pain-points-editor").value;
    proposalState.customPainPoints = val.split("\n").filter(line => line.trim() !== "");
    updatePreviewDebounced();
  });

  document.getElementById("strategy-editor").addEventListener("input", () => {
    proposalState.customStrategy = document.getElementById("strategy-editor").value;
    updatePreviewDebounced();
  });

  // Condições comerciais
  document.getElementById("contract-term-input").addEventListener("input", (e) => {
    proposalState.contractTerm = e.target.value || "Aviso prévio de 30 dias";
    updatePreviewDebounced();
    updateContractPreview();
  });

  document.getElementById("payment-terms-input").addEventListener("input", (e) => {
    proposalState.paymentTerms = e.target.value;
    updatePreviewDebounced();
    updateContractPreview();
  });

  document.getElementById("setup-payment-input").addEventListener("input", (e) => {
    proposalState.setupPaymentTerms = e.target.value;
    updatePreviewDebounced();
  });

  document.getElementById("media-investment-input").addEventListener("input", (e) => {
    proposalState.mediaInvestment = e.target.value;
    updatePreviewDebounced();
  });

  document.getElementById("work-start-input").addEventListener("input", (e) => {
    proposalState.workStart = e.target.value;
    updatePreviewDebounced();
  });

  document.getElementById("proposal-notes-input").addEventListener("input", (e) => {
    proposalState.proposalNotes = e.target.value;
    updatePreviewDebounced();
  });

  // Checkbox de slides
  document.querySelectorAll(".slide-toggle").forEach(toggle => {
    toggle.addEventListener("change", (e) => {
      const slide = e.target.dataset.slide;
      proposalState.includeSlides[slide] = e.target.checked;
      updatePreview();
    });
  });

  // Botão de download
  document.getElementById("btn-download-pdf").addEventListener("click", () => {
    generatePDF();
  });

  // Mostrar/Ocultar API Key
  const btnToggleKey = document.getElementById("btn-toggle-api-key");
  const apiKeyInput = document.getElementById("gemini-api-key");
  if (btnToggleKey && apiKeyInput) {
    btnToggleKey.addEventListener("click", () => {
      if (apiKeyInput.type === "password") {
        apiKeyInput.type = "text";
        btnToggleKey.innerHTML = '<i class="fa-solid fa-eye"></i>';
      } else {
        apiKeyInput.type = "password";
        btnToggleKey.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      }
    });

    // Salva automaticamente a chave conforme o usuário digita
    apiKeyInput.addEventListener("input", (e) => {
      localStorage.setItem("rakta_gemini_api_key", e.target.value.trim());
    });
  }

  // Gerar com Gemini API
  const btnGenerateGemini = document.getElementById("btn-generate-gemini");
  if (btnGenerateGemini) {
    btnGenerateGemini.addEventListener("click", () => {
      generateWithGemini();
    });
  }

  // Sobrescrita manual dos totais
  const overrideMonthlyInput = document.getElementById("override-monthly-input");
  if (overrideMonthlyInput) {
    overrideMonthlyInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      proposalState.overrideMonthly = val === "" ? null : parseFloat(val);
      updatePreviewDebounced();
    });
  }

  const discountMonthlyInput = document.getElementById("discount-monthly-input");
  if (discountMonthlyInput) {
    discountMonthlyInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      proposalState.discountMonthly = val === "" ? null : parseFloat(val);
      updatePreviewDebounced();
    });
  }

  const overrideOneOffInput = document.getElementById("override-oneoff-input");
  if (overrideOneOffInput) {
    overrideOneOffInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      proposalState.overrideOneOffAndSetup = val === "" ? null : parseFloat(val);
      updatePreviewDebounced();
    });
  }

  const discountOneOffInput = document.getElementById("discount-oneoff-input");
  if (discountOneOffInput) {
    discountOneOffInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      proposalState.discountOneOff = val === "" ? null : parseFloat(val);
      updatePreviewDebounced();
    });
  }

  // --- Temas ---
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const theme = e.currentTarget.dataset.theme;
      document.documentElement.setAttribute("data-theme", theme);
      document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b === e.currentTarget));
      localStorage.setItem("rakta_proposal_theme", theme);
      updatePreview();
    });
  });

  // --- Serviço Customizado ---
  const customServiceForm = document.getElementById("custom-service-form");
  const btnCustomTrigger = document.getElementById("btn-add-custom-service-trigger");
  if (btnCustomTrigger && customServiceForm) {
    btnCustomTrigger.addEventListener("click", () => {
      customServiceForm.classList.toggle("hidden");
    });
  }

  const btnCancelCustom = document.getElementById("btn-cancel-custom-service");
  if (btnCancelCustom && customServiceForm) {
    btnCancelCustom.addEventListener("click", () => {
      customServiceForm.classList.add("hidden");
      clearCustomServiceForm();
    });
  }

  const btnSaveCustom = document.getElementById("btn-save-custom-service");
  if (btnSaveCustom) {
    btnSaveCustom.addEventListener("click", () => {
      saveCustomService();
    });
  }

  // --- Exportar Rascunho JSON ---
  const btnExport = document.getElementById("btn-export-json");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(proposalState, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      const clientNameCleaned = proposalState.clientName.replace(/[\\/:*?"<>|]/g, "").trim() || "Cliente";
      downloadAnchor.setAttribute("download", `Proposta Rakta - ${clientNameCleaned}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // --- Importar Rascunho JSON ---
  const btnImport = document.getElementById("btn-import-json");
  const importFile = document.getElementById("import-json-file");
  if (btnImport && importFile) {
    btnImport.addEventListener("click", () => {
      importFile.click();
    });
    importFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed && typeof parsed === "object" && parsed.clientName) {
            proposalState = { ...proposalState, ...parsed };

            // Restore custom services in servicesData
            if (proposalState.selectedServices) {
              proposalState.selectedServices.forEach(s => {
                if (s.serviceId && s.serviceId.startsWith("custom_")) {
                  const categoryId = s.categoryId;
                  if (servicesData[categoryId]) {
                    const alreadyExists = servicesData[categoryId].services.some(orig => orig.id === s.serviceId);
                    if (!alreadyExists) {
                      servicesData[categoryId].services.push({
                        id: s.serviceId,
                        name: s.name,
                        isCustom: true,
                        levels: {
                          custom: {
                            name: s.period === "mês" ? "Nível Personalizado" : "Projeto Único",
                            price: s.price,
                            period: s.period,
                            recurring: s.recurring,
                            description: s.description
                          }
                        }
                      });
                    }
                  }
                }
              });
            }

            syncFieldsFromState();
            renderServicesSelector();
            rebuildActiveServiceCardsFromState();
            updatePreview();
            alert("Rascunho importado com sucesso!");
          } else {
            alert("Arquivo JSON inválido. Certifique-se de que é uma proposta Rakta.");
          }
        } catch (err) {
          alert("Erro ao ler o arquivo JSON: " + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = ""; // Reset
    });
  }

  // --- Modos de Visualização ---
  const btnModeScroll = document.getElementById("btn-mode-scroll");
  const btnModePres = document.getElementById("btn-mode-presentation");
  const slideControls = document.getElementById("slide-nav-controls");

  if (btnModeScroll && btnModePres) {
    btnModeScroll.addEventListener("click", () => {
      btnModeScroll.classList.add("active-view-mode");
      btnModeScroll.style.background = "var(--rakta-red)";
      btnModeScroll.style.color = "#fff";
      btnModePres.classList.remove("active-view-mode");
      btnModePres.style.background = "transparent";
      btnModePres.style.color = "var(--text-secondary)";
      if (slideControls) slideControls.classList.add("hidden");
      document.querySelectorAll(".slide-page-print").forEach(s => s.classList.remove("hidden"));
    });

    btnModePres.addEventListener("click", () => {
      btnModePres.classList.add("active-view-mode");
      btnModePres.style.background = "var(--rakta-red)";
      btnModePres.style.color = "#fff";
      btnModeScroll.classList.remove("active-view-mode");
      btnModeScroll.style.background = "transparent";
      btnModeScroll.style.color = "var(--text-secondary)";
      if (slideControls) slideControls.classList.remove("hidden");
      showCurrentSlideOnly();
    });
  }

  const btnPrev = document.getElementById("btn-prev-slide");
  const btnNext = document.getElementById("btn-next-slide");
  if (btnPrev && btnNext) {
    btnPrev.addEventListener("click", () => { navigateSlide(-1); });
    btnNext.addEventListener("click", () => { navigateSlide(1); });
  }

  const btnFullscreen = document.getElementById("btn-fullscreen-presentation");
  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => { toggleFullscreenSlides(); });
  }

  // --- Resetar Proposta ---
  const btnReset = document.getElementById("btn-reset-proposal");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      const confirmReset = confirm("Tem certeza que deseja resetar todas as informações da proposta? Isso limpará os dados do cliente e todos os serviços selecionados.");
      if (confirmReset) {
        // Restaura o estado padrão
        proposalState = JSON.parse(JSON.stringify(defaultProposalState));
        proposalState.contractClauses = { ...defaultClauses };

        // Remove do LocalStorage
        localStorage.removeItem("rakta_proposal_state");

        // Limpa serviços customizados em servicesData
        for (const categoryId in servicesData) {
          servicesData[categoryId].services = servicesData[categoryId].services.filter(s => !s.isCustom);
        }

        // Sincroniza campos da UI de volta com o estado padrão
        syncFieldsFromState();

        // Reconstrói seletores de serviços e esvazia cards ativos
        renderServicesSelector();
        rebuildActiveServiceCardsFromState();

        // Atualiza a visualização da proposta
        updatePreview();
      }
    });
  }

  // Teclas de seta
  document.addEventListener("keydown", (e) => {
    const isSlidesMode = btnModePres && btnModePres.classList.contains("active-view-mode");
    const isFullscreen = document.fullscreenElement !== null;
    if (isSlidesMode || isFullscreen) {
      if (e.key === "ArrowLeft") {
        navigateSlide(-1);
      } else if (e.key === "ArrowRight") {
        navigateSlide(1);
      }
    }
  });

  // --- IA Otimização de Cláusula/Diretriz de Contrato ---
  const btnOptimizeClause = document.getElementById("btn-optimize-clause");
  if (btnOptimizeClause) {
    btnOptimizeClause.addEventListener("click", () => {
      optimizeContractClause();
    });
  }

  const btnResetClause = document.getElementById("btn-reset-clause");
  if (btnResetClause) {
    btnResetClause.addEventListener("click", () => {
      resetContractClause();
    });
  }
}

// Sincroniza campos quando o nicho é alterado
function syncNicheFields() {
  const niche = nicheTemplates[proposalState.niche];
  proposalState.nicheName = niche.name;
  proposalState.customPainPoints = [...niche.painPoints];
  proposalState.customStrategy = niche.strategy;

  document.getElementById("niche-name-input").value = niche.name;
  document.getElementById("pain-points-editor").value = niche.painPoints.join("\n");
  document.getElementById("strategy-editor").value = niche.strategy;
}

// Atualiza a lista de serviços selecionados do estado (Option A - Dynamic Scanning)
function syncSelectedServices() {
  proposalState.selectedServices = [];

  document.querySelectorAll(".service-card-active").forEach(card => {
    const catId = card.dataset.cat;
    const serviceId = card.dataset.service;

    const levelSelect = card.querySelector(".service-level-select");
    const levelId = levelSelect.value;
    const priceInput = card.querySelector(".service-price-input");
    const descInput = card.querySelector(".service-desc-input");
    const recInput = card.querySelector(".service-recurring-input");

    const category = servicesData[catId];
    const service = category.services.find(s => s.id === serviceId);
    const level = service.levels[levelId];

    const bonusCheckbox = card.querySelector(".service-bonus-checkbox");
    const isBonus = bonusCheckbox ? bonusCheckbox.checked : false;

    proposalState.selectedServices.push({
      categoryId: catId,
      serviceId: serviceId,
      levelId: levelId,
      name: service.name,
      levelName: level.name,
      price: parseFloat(priceInput.value) || 0,
      description: descInput.value,
      period: level.period, // 'mês', 'projeto', 'setup', 'hora'
      recurring: recInput ? (parseFloat(recInput.value) || 0) : 0,
      isBonus: isBonus
    });
  });

  // Atualiza as opções do select de IA de contrato
  populateClauseSelect();
}

function populateClauseSelect() {
  const select = document.getElementById("contract-clause-select");
  if (!select) return;

  // Guarda o valor anteriormente selecionado para restaurá-lo se ainda existir
  const prevVal = select.value;

  select.innerHTML = "";

  // Cláusulas Contratuais Fixas
  const clausesGroup = document.createElement("optgroup");
  clausesGroup.label = "Cláusulas Jurídicas (MSA)";
  
  const options = [
    { value: "clause1", text: "Cláusula Primeira (Premissas Contratuais)" },
    { value: "clause2", text: "Cláusula Segunda (Adequação do Escopo)" },
    { value: "clause3", text: "Cláusula Terceira (Forma de Pagamento)" },
    { value: "clause4", text: "Cláusula Quarta (Obrigações da Contratada)" },
    { value: "clause5", text: "Cláusula Quinta (Obrigações da Contratante)" },
    { value: "clause6", text: "Cláusula Sexta (Sigilo e Confidencialidade)" },
    { value: "clause7", text: "Cláusula Sétima (Independência entre as Partes)" },
    { value: "clause8", text: "Cláusula Oitava (Proteção de Dados)" },
    { value: "clause9", text: "Cláusula Nona (Compliance)" },
    { value: "clause10", text: "Cláusula Décima (Resolução de Conflitos)" },
    { value: "clause11", text: "Cláusula Décima Primeira (Cancelamento & Rescisão)" },
    { value: "clause12", text: "Cláusula Décima Segunda (Titularidade de Ativos)" },
    { value: "clause13", text: "Cláusula Décima Terceira (Disposições Gerais)" }
  ];

  options.forEach(opt => {
    const el = document.createElement("option");
    el.value = opt.value;
    el.textContent = opt.text;
    clausesGroup.appendChild(el);
  });
  select.appendChild(clausesGroup);

  // Diretrizes Relevantes dos Serviços Ativos
  if (proposalState.selectedServices && proposalState.selectedServices.length > 0) {
    const guidelinesGroup = document.createElement("optgroup");
    guidelinesGroup.label = "Diretrizes dos Serviços Ativos";

    proposalState.selectedServices.forEach(s => {
      const el = document.createElement("option");
      el.value = `guideline_${s.serviceId}`;
      el.textContent = `Diretriz - ${s.name}`;
      guidelinesGroup.appendChild(el);
    });

    select.appendChild(guidelinesGroup);
  }

  // Restaura valor selecionado anteriormente se ele ainda for válido
  if (prevVal) {
    const exists = Array.from(select.options).some(opt => opt.value === prevVal);
    if (exists) {
      select.value = prevVal;
    }
  }
}

// Atualiza a visualização em tempo real (Renderizador DOM)
function updatePreview() {
  const container = document.getElementById("slides-preview");
  container.innerHTML = ""; // Limpa a visualização anterior

  // Atualiza placeholders dos inputs de valores manuais com a soma automática atualizada
  const totalsForPlaceholders = calculateTotals();
  const overrideMonthlyInput = document.getElementById("override-monthly-input");
  if (overrideMonthlyInput) {
    overrideMonthlyInput.placeholder = `Auto: R$ ${totalsForPlaceholders.autoMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const overrideOneOffInput = document.getElementById("override-oneoff-input");
  if (overrideOneOffInput) {
    overrideOneOffInput.placeholder = `Auto: R$ ${totalsForPlaceholders.autoOneOffAndSetup.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  let slideIndex = 1;

  // 1. Slide de Capa
  if (proposalState.includeSlides.cover) {
    const slide = createSlideElement("assets/Modelo Rakta - Proposta Comercial.webp");
    slide.innerHTML += `
      <div class="cover-card" style="position: absolute; bottom: 50px; right: 50px; width: 420px; padding: 30px; background: rgba(7,7,9,0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1); z-index: 10;">
        <div class="cover-tag" style="font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.4em; color: #e30613; margin-bottom: 12px; text-transform: uppercase;">PROPOSTA COMERCIAL</div>
        <div class="cover-client" style="font-family: Arial, sans-serif; font-size: 32px; font-weight: 700; line-height: 1.15; color: #ffffff; margin-bottom: 10px; letter-spacing: -0.02em; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">${proposalState.clientName}</div>
        <div class="cover-project" style="font-family: Arial, sans-serif; font-size: 14px; color: #a1a1aa; font-weight: 300; margin-bottom: 24px; border-left: 2px solid #e30613; padding-left: 12px;">${proposalState.projectName}</div>
        <div class="cover-footer" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; display: flex; justify-content: space-between; font-family: Arial, sans-serif; font-size: 10px; color: #a1a1aa;">
          <div><strong style="color: #ffffff;">Foco:</strong> ${proposalState.nicheName}</div>
          <div><strong style="color: #ffffff;">Validade:</strong> ${getValidityDateString(proposalState.validityDays)}</div>
        </div>
      </div>
    `;
    addSlideToPreview(container, slide, slideIndex++);
  }

  // 2. Slide de Problema
  if (proposalState.includeSlides.problem) {
    const slide = createSlideElement("assets/Modelo Rakta - Proposta Comercial (1).webp");

    let painHTML = "";
    proposalState.customPainPoints.forEach(point => {
      painHTML += `<li style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #a1a1aa; margin-bottom: 10px; display: flex; gap: 8px; align-items: flex-start;"><span class="bullet-red" style="color: #e30613; font-size: 14px; line-height: 1;">•</span> ${point}</li>`;
    });

    let strategyHTML = "";
    const strategySentences = proposalState.customStrategy
      .split('.')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    strategySentences.forEach(sentence => {
      strategyHTML += `<li style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #a1a1aa; margin-bottom: 10px; display: flex; gap: 8px; align-items: flex-start;"><span class="bullet-red" style="color: #e30613; font-size: 14px; line-height: 1;">•</span> ${sentence}</li>`;
    });

    slide.innerHTML += `
      <div class="problem-overlay-left" style="position: absolute; top: 100px; left: 50px; width: 330px; padding: 24px; background: rgba(5,5,7,0.90); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 4px solid #e30613; border-radius: 0 12px 12px 0; box-shadow: 0 20px 40px rgba(0,0,0,0.6); z-index: 10;">
        <div class="overlay-tag" style="font-family: Arial, sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.3em; color: #e30613; margin-bottom: 6px;">DIAGNÓSTICO ESTRATÉGICO</div>
        <div class="overlay-title" style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 18px; text-transform: uppercase;">DORES DO CLIENTE</div>
        <ul class="pain-points-list" style="list-style: none; margin-top: 10px; padding-left: 0;">
          ${painHTML}
        </ul>
      </div>

      <div class="problem-overlay-right" style="position: absolute; top: 100px; right: 50px; width: 330px; padding: 24px; background: rgba(5,5,7,0.90); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 4px solid #e30613; border-radius: 0 12px 12px 0; box-shadow: 0 20px 40px rgba(0,0,0,0.6); z-index: 10;">
        <div class="overlay-tag" style="font-family: Arial, sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.3em; color: #e30613; margin-bottom: 6px;">DIAGNÓSTICO ESTRATÉGICO</div>
        <div class="overlay-title" style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 18px; text-transform: uppercase;">ESTRATÉGIA RECOMENDADA</div>
        <ul class="strategy-list" style="list-style: none; margin-top: 10px; padding-left: 0;">
          ${strategyHTML}
        </ul>
        <p class="problem-footer-text" style="font-family: Arial, sans-serif; font-size: 10px; color: #52525b; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-top: 12px;">
          Nosso objetivo com esta proposta é remover os bloqueadores e aplicar esta estratégia para acelerar seus resultados.
        </p>
      </div>
    `;
    addSlideToPreview(container, slide, slideIndex++);
  }

  // 3. Slide Testemunhos
  if (proposalState.includeSlides.testimonials) {
    const slide = createSlideElement("assets/Modelo Rakta - Proposta Comercial (2).webp");
    addSlideToPreview(container, slide, slideIndex++);
  }

  // 4. Slide Portfólio Web
  if (proposalState.includeSlides.portfolio_web) {
    const slide = createSlideElement("assets/Modelo Rakta - Proposta Comercial (3).webp");
    addSlideToPreview(container, slide, slideIndex++);
  }

  // 5. Slide Portfólio Social Media
  if (proposalState.includeSlides.portfolio_social) {
    const slide = createSlideElement("assets/Modelo Rakta - Proposta Comercial (4).webp");
    addSlideToPreview(container, slide, slideIndex++);
  }

  // 6. Slide Metodologia
  if (proposalState.includeSlides.method) {
    const slide = createSlideElement("assets/Modelo Rakta - Proposta Comercial (5).webp");
    addSlideToPreview(container, slide, slideIndex++);
  }

  // 7. Serviços
  if (proposalState.includeSlides.services && proposalState.selectedServices.length > 0) {
    const monthlySelected = proposalState.selectedServices.filter(s => s.period === "mês");
    const oneoffSelected = proposalState.selectedServices.filter(s => s.period !== "mês");
    const servicesPerPage = 3;

    const categoryOrder = ["performance", "branding", "digital", "tecnologia", "crm", "consultoria"];
    const sortByBonusAndCategory = (a, b) => {
      if (a.isBonus && !b.isBonus) return -1;
      if (!a.isBonus && b.isBonus) return 1;
      return categoryOrder.indexOf(a.categoryId) - categoryOrder.indexOf(b.categoryId);
    };
    monthlySelected.sort(sortByBonusAndCategory);
    oneoffSelected.sort(sortByBonusAndCategory);

    if (monthlySelected.length > 0) {
      const pagesCount = Math.ceil(monthlySelected.length / servicesPerPage);
      for (let i = 0; i < pagesCount; i++) {
        const slide = createSlideElement();
        slide.classList.add("dark-mesh-bg");
        const pageServices = monthlySelected.slice(i * servicesPerPage, (i + 1) * servicesPerPage);
        let servicesCardsHTML = "";
        pageServices.forEach(srv => {
          const bullets = parseDescriptionToBullets(srv.description);
          let bulletsHTML = "";
          bullets.forEach(b => { bulletsHTML += `<li><span class="bullet-red-small">•</span> ${b}</li>`; });
          const bonusBadge = srv.isBonus ? getBonusBadgeHTML() : "";
          const compactClass = getCompactClassForService(srv.description);
          servicesCardsHTML += `
            <div class="service-preview-card ${srv.isBonus ? 'service-preview-card-bonus' : ''} ${compactClass}">
              <div class="service-preview-header" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                <h3>${srv.name}</h3>
                ${bonusBadge}
              </div>
              <ul class="service-preview-bullets">${bulletsHTML}</ul>
            </div>
          `;
        });
        slide.innerHTML = `
          <div class="mesh-blob blob-1"></div>
          <div class="mesh-blob blob-2"></div>
          <div class="services-slide-container">
            <div class="slide-header flex justify-between items-end">
              <div><span class="slide-sup-title">ESCOPO RECORRENTE</span><h2 class="slide-main-title">SERVIÇOS MENSAIS</h2></div>
              <span class="slide-pagination">${i + 1} / ${pagesCount}</span>
            </div>
            <div class="services-grid-preview">${servicesCardsHTML}</div>
          </div>
        `;
        addSlideToPreview(container, slide, slideIndex++);
      }
    }

    if (oneoffSelected.length > 0) {
      const pagesCount = Math.ceil(oneoffSelected.length / servicesPerPage);
      for (let i = 0; i < pagesCount; i++) {
        const slide = createSlideElement();
        slide.classList.add("dark-mesh-bg");
        const pageServices = oneoffSelected.slice(i * servicesPerPage, (i + 1) * servicesPerPage);
        let servicesCardsHTML = "";
        pageServices.forEach(srv => {
          const bullets = parseDescriptionToBullets(srv.description);
          let bulletsHTML = "";
          bullets.forEach(b => { bulletsHTML += `<li><span class="bullet-red-small">•</span> ${b}</li>`; });
          const bonusBadge = srv.isBonus ? getBonusBadgeHTML() : "";
          const compactClass = getCompactClassForService(srv.description);
          servicesCardsHTML += `
            <div class="service-preview-card ${srv.isBonus ? 'service-preview-card-bonus' : ''} ${compactClass}">
              <div class="service-preview-header" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                <h3>${srv.name}</h3>
                ${bonusBadge}
              </div>
              <ul class="service-preview-bullets">${bulletsHTML}</ul>
            </div>
          `;
        });
        slide.innerHTML = `
          <div class="mesh-blob blob-1"></div>
          <div class="mesh-blob blob-2"></div>
          <div class="services-slide-container">
            <div class="slide-header flex justify-between items-end">
              <div><span class="slide-sup-title">ESCOPO PONTUAL</span><h2 class="slide-main-title">PROJETOS E SETUPS</h2></div>
              <span class="slide-pagination">${i + 1} / ${pagesCount}</span>
            </div>
            <div class="services-grid-preview">${servicesCardsHTML}</div>
          </div>
        `;
        addSlideToPreview(container, slide, slideIndex++);
      }
    }
  }

  // 8. Investimento
  if (proposalState.includeSlides.investment) {
    const slide = createSlideElement();
    slide.classList.add("dark-mesh-bg");
    const totals = calculateTotals();
    const monthlyServices = totals.monthlyServices;
    const projectServices = totals.projectServices;
    const setupServices = totals.setupServices;
    const autoMonthly = totals.autoMonthly;
    const autoOneOffAndSetup = totals.autoOneOffAndSetup;

    const getServiceCellContent = (s) => {
      const priceText = s.isBonus ? getBonusPriceTextHTML(s.price) : `<i class="fa-solid fa-circle-check"></i> Incluso`;
      let nameHTML = `<div>${getBonusServiceNameHTML(s.name, s.isBonus)}</div>`;
      let priceHTML = `<div style="color: var(--rakta-red); font-weight: bold;">${priceText}</div>`;
      if (s.period === "setup" && s.recurring > 0) {
        const recurringPriceText = s.isBonus ? getBonusPriceTextHTML(s.recurring, true) : '<i class="fa-solid fa-circle-check"></i> Incluso';
        nameHTML += `<div style="font-size: 9px; color: var(--text-muted); margin-top: 2px; font-weight: normal; padding-left: 8px;">↳ Manutenção de CRM/Chatbot vinculada</div>`;
        priceHTML += `<div style="font-size: 9px; color: var(--text-muted); margin-top: 2px; font-weight: bold;">${recurringPriceText}</div>`;
      }
      return { nameHTML, priceHTML };
    };

    let investmentRowsHTML = "";
    if (monthlyServices.length > 0) {
      investmentRowsHTML += `<tr class="table-section-header"><td colspan="2">Recorrência Mensal</td></tr>`;
      monthlyServices.forEach(s => {
        const c = getServiceCellContent(s);
        investmentRowsHTML += `<tr><td>${c.nameHTML}</td><td class="text-right">${c.priceHTML}</td></tr>`;
      });
    }
    const oneOffServices = [...setupServices, ...projectServices];
    if (oneOffServices.length > 0) {
      investmentRowsHTML += `<tr class="table-section-header"><td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.05);">Projetos e Setups Únicos</td></tr>`;
      oneOffServices.forEach(s => {
        const c = getServiceCellContent(s);
        investmentRowsHTML += `<tr><td>${c.nameHTML}</td><td class="text-right">${c.priceHTML}</td></tr>`;
      });
    }

    slide.innerHTML = `
      <div class="mesh-blob blob-1"></div>
      <div class="mesh-blob blob-3"></div>
      <div class="services-slide-container">
        <div class="slide-header">
          <span class="slide-sup-title">PELA RAKTA DIGITAL PARA ${proposalState.clientName.toUpperCase()}</span>
          <h2 class="slide-main-title">RESUMO DO PLANO</h2>
        </div>
        <div class="investment-layout">
          <div class="investment-left">
            <div class="table-card">
              <table class="investment-table"><thead><tr><th>Escopo</th><th class="text-right">Investimento</th></tr></thead><tbody>${investmentRowsHTML}</tbody></table>
            </div>
            <div class="totals-block">
              ${totals.totalMonthly > 0 ? (
                (proposalState.discountMonthly !== null && proposalState.discountMonthly !== undefined && proposalState.discountMonthly > 0) ? `
                  <div class="total-card total-card-discounted">
                    <span>INVESTIMENTO MENSAL</span>
                    <h3>
                      <span style="text-decoration: line-through; font-size: 14px; color: #a1a1aa !important; margin-right: 8px; font-weight: normal; opacity: 0.7;">${formatCurrency(totals.baseMonthly)}</span>
                      ${formatCurrency(totals.totalMonthly)}<span class="period">/mês</span>
                    </h3>
                  </div>
                ` : `
                  <div class="total-card">
                    <span>INVESTIMENTO MENSAL</span>
                    <h3>${formatCurrency(totals.totalMonthly)}<span class="period">/mês</span></h3>
                  </div>
                `
              ) : ""}
              ${totals.totalOneOffAndSetup > 0 ? (
                (proposalState.discountOneOff !== null && proposalState.discountOneOff !== undefined && proposalState.discountOneOff > 0) ? `
                  <div class="total-card total-card-discounted">
                    <span>PROJETOS E SETUP ÚNICO</span>
                    <h3>
                      <span style="text-decoration: line-through; font-size: 14px; color: #a1a1aa !important; margin-right: 8px; font-weight: normal; opacity: 0.7;">${formatCurrency(totals.baseOneOffAndSetup)}</span>
                      ${formatCurrency(totals.totalOneOffAndSetup)}<span class="period"> (total)</span>
                    </h3>
                  </div>
                ` : `
                  <div class="total-card">
                    <span>PROJETOS E SETUP ÚNICO</span>
                    <h3>${formatCurrency(totals.totalOneOffAndSetup)}<span class="period"> (total)</span></h3>
                  </div>
                `
              ) : ""}
            </div>
          </div>
          <div class="investment-right">
            <div class="conditions-card">
              <h4>CONDIÇÕES COMERCIAIS</h4>
              <ul>
                <li><strong>Prazo Contratual:</strong> ${proposalState.contractTerm}</li>
                <li><strong>Serviços Recorrentes:</strong> ${proposalState.paymentTerms}</li>
                ${totals.totalOneOffAndSetup > 0 ? `<li><strong>Projetos e Setups:</strong> ${proposalState.setupPaymentTerms}</li>` : ""}
                ${proposalState.mediaInvestment ? `<li><strong>Investimento em Mídia:</strong> ${proposalState.mediaInvestment}</li>` : ""}
                <li><strong>Início dos Trabalhos:</strong> ${proposalState.workStart}</li>
                ${proposalState.proposalNotes ? `<li style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.05);"><strong>Observações:</strong> ${proposalState.proposalNotes}</li>` : ""}
              </ul>
            </div>
            <div class="signatures-block">
                <div class="sig-line"></div>
                <span>Pela Rakta Digital</span>
              </div>
              <div class="signature-box">
                <div class="sig-line"></div>
                <span>Para ${proposalState.clientName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    addSlideToPreview(container, slide, slideIndex++);
  }

  // 9. Slide Fechamento/Logos
  if (proposalState.includeSlides.logos) {
    const slide = createSlideElement("assets/Modelo Rakta - Proposta Comercial (6).webp");
    slide.innerHTML += `
      <div class="contact-box-overlay">
        <div class="contact-title">DÚVIDAS OU PRÓXIMOS PASSOS? FALE CONOSCO</div>
        <div class="contact-links">
          <span><i class="fas fa-envelope"></i> marcel.andrade@rakta.digital</span>
          <span><i class="fas fa-globe"></i> www.rakta.digital</span>
          <span><i class="fa-solid fa-phone"></i> (71) 3190-1921</span>
        </div>
      </div>
    `;
    addSlideToPreview(container, slide, slideIndex++);
  }

  // Ajusta a escala inicial
  setTimeout(updateSlideScale, 50);

  // Auto-salva o estado no LocalStorage
  saveToLocalStorage();

  // Se o modo de apresentação estiver ativo, garante que apenas o slide atual fique visível
  const btnModePres = document.getElementById("btn-mode-presentation");
  if (btnModePres && btnModePres.classList.contains("active-view-mode")) {
    showCurrentSlideOnly();
  }
}

// Função de debounce para adiar execuções repetitivas de renderização
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const updatePreviewDebounced = debounce(updatePreview, 200);

// Auxiliar: Cria o elemento base do slide (1122x794px)
function createSlideElement(bgImagePath = null) {
  const slide = document.createElement("div");
  slide.className = "slide-content-scale";

  if (bgImagePath) {
    // Carrega a imagem diretamente pelo caminho relativo para usar a nova versão PNG em alta qualidade
    slide.style.backgroundImage = `url('${bgImagePath}')`;
  }
  return slide;
}

// Auxiliar: Embrulha o slide e coloca na lista de visualização
function addSlideToPreview(container, slideElement, number) {
  const wrapper = document.createElement("div");
  wrapper.className = "slide-wrapper";
  wrapper.appendChild(slideElement);

  // Adiciona badge de número da página
  const badge = document.createElement("div");
  badge.className = "slide-page-badge";
  badge.textContent = `Slide ${number}`;

  const outerWrapper = document.createElement("div");
  outerWrapper.className = "outer-slide-wrapper";
  outerWrapper.appendChild(badge);
  outerWrapper.appendChild(wrapper);

  container.appendChild(outerWrapper);
}

// Ajusta a escala das caixas de slide no preview
function updateSlideScale() {
  const wrappers = document.querySelectorAll(".slide-wrapper");
  wrappers.forEach(wrapper => {
    const scale = wrapper.clientWidth / 960; // Escala baseada no container pai de 960px
    const content = wrapper.querySelector(".slide-content-scale");
    if (content) {
      content.style.transform = `scale(${scale})`;
    }
  });
}

// Monitora redimensionamento da janela para atualizar escala dos previews
window.addEventListener("resize", updateSlideScale);

// Auxiliares de Formatação e Data
function formatCurrency(val) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(val);
}

function getValidityDateString(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("pt-BR");
}

// Função de Exportação em PDF — captura slide a slide com html2canvas + jsPDF puros
async function generatePDF() {
  const btn = document.getElementById("btn-download-pdf");
  const originalText = btn.innerHTML;
  btn.innerHTML = "<i class='fas fa-circle-notch fa-spin'></i> Gerando PDF...";
  btn.disabled = true;

  try {
    // Garante que todas as fontes estejam carregadas antes de capturar
    await document.fonts.ready;

    const SLIDE_W = 2560;
    const SLIDE_H = 1440;
    const slides = document.querySelectorAll(".slide-content-scale");

    if (slides.length === 0) {
      alert("Nenhum slide para exportar. Ative ao menos um slide no painel.");
      return;
    }

    // Dimensões em mm a 96 DPI: 960px = ~254mm, 540px = ~142.9mm
    const pdfW = (SLIDE_W * 25.4) / 96;
    const pdfH = (SLIDE_H * 25.4) / 96;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [pdfW, pdfH],
      compress: true
    });

    // Container temporário fora da tela para renderização limpa
    const offscreen = document.createElement("div");
    offscreen.style.cssText = [
      "position: absolute",
      "top: -99999px",
      "left: -99999px",
      `width: ${SLIDE_W}px`,
      `height: ${SLIDE_H}px`,
      "overflow: hidden",
      "pointer-events: none"
    ].join(";");
    document.body.appendChild(offscreen);

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      // Clona o slide real (deep clone preserva todos os estilos e classes)
      const renderEl = slide.cloneNode(true);

      // Remove a escala do preview e força dimensões corretas
      renderEl.style.position = "relative";
      renderEl.style.width = SLIDE_W + "px";
      renderEl.style.height = SLIDE_H + "px";
      renderEl.style.overflow = "hidden";
      renderEl.style.transform = "none";
      renderEl.style.transformOrigin = "top left";

      // Cria um wrapper para escalar todo o conteúdo interno do slide
      // mantendo as proporções e coordenadas base de 960x540
      const wrapper = document.createElement("div");
      wrapper.style.width = "960px";
      wrapper.style.height = "540px";
      wrapper.style.transform = `scale(${SLIDE_W / 960})`;
      wrapper.style.transformOrigin = "top left";
      wrapper.style.position = "absolute";
      wrapper.style.top = "0";
      wrapper.style.left = "0";

      // Move todos os nós filhos do clone para dentro do wrapper
      while (renderEl.firstChild) {
        wrapper.appendChild(renderEl.firstChild);
      }
      renderEl.appendChild(wrapper);

      // Garante background do slide
      if (!renderEl.style.backgroundImage || renderEl.style.backgroundImage === "none") {
        renderEl.style.backgroundImage = slide.style.backgroundImage;
      }
      renderEl.style.backgroundSize = "cover";
      renderEl.style.backgroundPosition = "center";

      // Pré-carrega e decodifica a imagem de fundo para garantir resolução e renderização completas no html2canvas
      if (renderEl.style.backgroundImage && renderEl.style.backgroundImage !== "none") {
        const bgImgUrlMatch = renderEl.style.backgroundImage.match(/url\((['"]?)(.*?)\1\)/);
        if (bgImgUrlMatch && bgImgUrlMatch[2]) {
          const bgImgUrl = bgImgUrlMatch[2];
          await new Promise((resolve) => {
            const img = new Image();
            img.src = bgImgUrl;
            if (img.complete) {
              if (img.decode) {
                img.decode().then(resolve).catch(resolve);
              } else {
                resolve();
              }
            } else {
              img.onload = () => {
                if (img.decode) {
                  img.decode().then(resolve).catch(resolve);
                } else {
                  resolve();
                }
              };
              img.onerror = resolve;
            }
          });
        }
      }

      let bgColor = window.getComputedStyle(slide).backgroundColor;
      if (!bgColor || bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
        bgColor = "#040405";
      }

      // html2canvas NÃO suporta filter:blur() — remove os mesh-blobs e substitui
      // por um radial-gradient equivalente no background (resultado visual idêntico)
      renderEl.querySelectorAll(".mesh-blob").forEach(blob => blob.remove());
      if (renderEl.classList.contains("dark-mesh-bg")) {
        renderEl.style.backgroundImage = [
          "radial-gradient(ellipse 55% 55% at 100% 0%,   rgba(227,6,19,0.18) 0%, transparent 70%)",
          "radial-gradient(ellipse 45% 45% at 0%   110%,  rgba(153,0,0,0.14)  0%, transparent 65%)",
          "radial-gradient(ellipse 65% 65% at 100% 120%,  rgba(227,6,19,0.12) 0%, transparent 70%)"
        ].join(", ");
        renderEl.style.backgroundColor = "#040405";
      }

      // Captura o offsetHeight do .cover-card do slide original (DOM conectado)
      const origCoverCard = slide.querySelector(".cover-card");
      const coverCardHeight = origCoverCard ? origCoverCard.offsetHeight : 230;

      // html2canvas NÃO suporta backdrop-filter — substitui por backgrounds OPACOS
      // e aplica TODOS os estilos inline diretamente para garantir renderização
      const backdropFixes = [
        {
          sel: ".cover-card",
          styles: {
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            background: "#070709",
            backgroundColor: "#070709",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            position: "absolute",
            top: `${540 - 50 - coverCardHeight}px`,
            left: `${960 - 50 - 420}px`,
            width: "420px",
            padding: "30px",
            boxShadow: "none",
            zIndex: "10",
            animation: "none",
            transition: "none",
            opacity: "1"
          }
        },
        {
          sel: ".problem-overlay-left",
          styles: {
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            background: "#030305",
            backgroundColor: "#030305",
            boxShadow: "none",
            position: "absolute",
            top: "100px",
            left: "50px",
            width: "330px",
            padding: "24px",
            borderLeft: "4px solid #e30613",
            borderRadius: "0 12px 12px 0"
          }
        },
        {
          sel: ".problem-overlay-right",
          styles: {
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            background: "#030305",
            backgroundColor: "#030305",
            boxShadow: "none",
            position: "absolute",
            top: "100px",
            right: "50px",
            width: "330px",
            padding: "24px",
            borderLeft: "4px solid #e30613",
            borderRadius: "0 12px 12px 0"
          }
        },
        {
          sel: ".contact-box-overlay",
          styles: {
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            background: "#070709",
            backgroundColor: "#070709",
            boxShadow: "none",
            border: "1px solid rgba(255,255,255,0.08)"
          }
        },
        {
          sel: ".conditions-card",
          styles: {
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            background: "#0a0a0e",
            backgroundColor: "#0a0a0e",
            boxShadow: "none"
          }
        },
        {
          sel: ".service-preview-card:not(.service-preview-card-bonus)",
          styles: {
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            background: "#0a0a0e",
            backgroundColor: "#0a0a0e",
            boxShadow: "none"
          }
        },
        {
          sel: ".service-preview-card-bonus",
          styles: {
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            background: "#0a0a0e",
            backgroundColor: "#0a0a0e",
            border: "1px solid rgba(21, 128, 61, 0.5)",
            borderColor: "rgba(21, 128, 61, 0.5)",
            boxShadow: "none"
          }
        },
        {
          sel: ".total-card",
          styles: {
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            background: "#1e0204",
            backgroundColor: "#1e0204",
            boxShadow: "none"
          }
        },
        {
          sel: ".table-card",
          styles: {
            maxHeight: "none",
            overflow: "visible",
            overflowY: "visible"
          }
        },
      ];

      backdropFixes.forEach(({ sel, styles }) => {
        renderEl.querySelectorAll(sel).forEach(el => {
          Object.assign(el.style, styles);
        });
      });
      // Força estilos de texto nos elementos do cover-card para html2canvas
      renderEl.querySelectorAll(".cover-tag").forEach(el => {
        el.style.fontFamily = "Arial, sans-serif";
        el.style.fontSize = "10px";
        el.style.fontWeight = "700";
        el.style.letterSpacing = "0.4em";
        el.style.color = "#e30613";
        el.style.marginBottom = "12px";
        el.style.textTransform = "uppercase";
      });
      renderEl.querySelectorAll(".cover-client").forEach(el => {
        el.style.fontFamily = "Arial, sans-serif";
        el.style.fontSize = el.innerText.length > 20 ? "24px" : "32px";
        el.style.fontWeight = "700";
        el.style.lineHeight = "1.15";
        el.style.color = "#ffffff";
        el.style.marginBottom = "10px";
        el.style.wordBreak = "break-word";
      });
      renderEl.querySelectorAll(".cover-project").forEach(el => {
        el.style.fontFamily = "Arial, sans-serif";
        el.style.fontSize = "14px";
        el.style.color = "#a1a1aa";
        el.style.fontWeight = "300";
        el.style.marginBottom = "24px";
        el.style.borderLeft = "2px solid #e30613";
        el.style.paddingLeft = "12px";
      });
      renderEl.querySelectorAll(".cover-footer").forEach(el => {
        el.style.fontFamily = "Arial, sans-serif";
        el.style.borderTop = "1px solid rgba(255,255,255,0.08)";
        el.style.paddingTop = "16px";
        el.style.display = "flex";
        el.style.justifyContent = "space-between";
        el.style.fontSize = "10px";
        el.style.color = "#a1a1aa";
      });
      renderEl.querySelectorAll(".cover-footer strong").forEach(el => {
        el.style.color = "#ffffff";
      });

      offscreen.innerHTML = "";
      offscreen.appendChild(renderEl);

      // Captura com html2canvas em resolução de altíssima qualidade (scale 1.5)
      const canvas = await html2canvas(renderEl, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: SLIDE_W,
        height: SLIDE_H,
        windowWidth: SLIDE_W,
        windowHeight: SLIDE_H,
        backgroundColor: bgColor || "#040405",
        onclone: (clonedDoc) => {
          return document.fonts.ready;
        }
      });

      // Exporta em JPEG com 99% de qualidade (fidelidade visual máxima)
      const imgData = canvas.toDataURL("image/jpeg", 0.99);

      if (i > 0) {
        pdf.addPage([pdfW, pdfH], "landscape");
      }
      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH, undefined, "NONE");
    }

    document.body.removeChild(offscreen);

    const clientNameCleaned = proposalState.clientName.replace(/[\\/:*?"<>|]/g, "").trim();
    pdf.save(`Proposta Rakta - ${clientNameCleaned}.pdf`);

  } catch (err) {
    console.error("Erro na geração do PDF:", err);
    alert("Ocorreu um erro ao gerar o PDF: " + err.message + "\nVerifique o console (F12).");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Auxiliar: Converte texto de escopo corrido em tópicos (bullet points)
function parseDescriptionToBullets(descText) {
  if (!descText) return [];
  if (Array.isArray(descText)) return descText;

  let text = descText.trim();

  // Verifica se há quebras de linha
  let lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  let parts = [];

  if (lines.length > 1) {
    // Possui quebras de linha, tratar cada linha como um bullet
    lines.forEach(line => {
      // Remove marcadores comuns de lista no início da linha (ex: -, *, •, 1., a))
      let cleaned = line
        .replace(/^[-\*\u2022\u25E6\u2023\u2043\u25CB\u25CF\u25A0\u25A1]\s*/, "")
        .replace(/^\d+[\.\)]\s*/, "")
        .trim();
      if (cleaned.length > 0) {
        parts.push(cleaned);
      }
    });
  } else {
    // Sem quebras de linha, divide por ponto e vírgula se houver, ou por vírgula normal
    if (text.includes(';')) {
      parts = text.split(/;(?![^(]*\))/).map(p => p.trim()).filter(p => p.length > 0);
    } else {
      parts = text.split(/,(?![^(]*\))/).map(p => p.trim()).filter(p => p.length > 0);
    }
  }

  return parts
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Capitaliza a primeira letra
      let s = p.charAt(0).toUpperCase() + p.slice(1);
      // Remove ponto final se houver
      if (s.endsWith('.')) {
        s = s.slice(0, -1);
      }
      return s;
    });
}

// Determina se o card de serviço precisa de uma estilização mais compacta para não cortar o texto
function getCompactClassForService(description) {
  if (!description) return "";
  const bullets = parseDescriptionToBullets(description);
  const totalLength = description.length;
  const numBullets = bullets.length;

  if (totalLength > 750 || numBullets > 7) {
    return "compact-lg";
  } else if (totalLength > 600 || numBullets > 6) {
    return "compact-md";
  } else if (totalLength > 480 || numBullets > 5) {
    return "compact-sm";
  }
  return "";
}

// Carrega a chave da API do Gemini a partir do localStorage
function loadGeminiApiKey() {
  const savedKey = localStorage.getItem("rakta_gemini_api_key");
  if (savedKey) {
    const keyInput = document.getElementById("gemini-api-key");
    if (keyInput) keyInput.value = savedKey;
  }
}

// Gera dores e estratégias de forma personalizada usando o Gemini API
async function generateWithGemini() {
  const apiKeyInput = document.getElementById("gemini-api-key");
  const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";

  if (!apiKey) {
    alert("Por favor, insira uma Chave de API do Gemini para prosseguir.");
    return;
  }

  if (proposalState.selectedServices.length === 0) {
    alert("Por favor, adicione pelo menos um serviço na barra lateral antes de otimizar com Inteligência Artificial.");
    return;
  }

  // Salva no localStorage
  localStorage.setItem("rakta_gemini_api_key", apiKey);

  // Sincroniza os serviços selecionados a partir dos inputs atuais na UI antes de enviar para a IA
  syncSelectedServices();

  const btn = document.getElementById("btn-generate-gemini");
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Otimizando com IA...';

  const clientName = proposalState.clientName;
  const nicheName = proposalState.nicheName;

  // Tom de voz selecionado
  const toneSelect = document.getElementById("gemini-tone-select");
  const toneMap = {
    "persuasivo": "persuasivo e comercial — use linguagem que venda, com benefícios claros e gatilhos de valor",
    "tecnico": "técnico e detalhado — seja preciso, formal e use terminologia especializada de marketing",
    "direto": "direto e minimalista — seja conciso, objective e evite floreios"
  };
  const selectedTone = toneSelect ? toneSelect.value : "persuasivo";
  const toneDescription = toneMap[selectedTone] || toneMap["persuasivo"];

  // Lista de serviços simplificada para enviar à IA usando o que está escrito em cada serviço atualmente
  const servicesList = proposalState.selectedServices.map(s => {
    return {
      id: s.serviceId,
      name: s.name,
      description: s.description
    };
  });

  const prompt = `Você é um estrategista de marketing e copywriter sênior da Rakta Digital. Tom de redação: ${toneDescription}.
O seu objetivo é:
1. Reescrever o escopo de entregas de cada serviço selecionado para o cliente "${clientName}" que atua no nicho de "${nicheName}".
2. Criar uma Estratégia Recomendada sob medida para o cliente de acordo com as seguintes dores identificadas:
${proposalState.customPainPoints.map(p => `- ${p}`).join("\n")}

A Estratégia Recomendada deve ser estruturada em 3 ou 4 frases curtas e objetivas, onde cada frase descreve uma ação prática. Separe cada frase com um ponto final (ex: "Frase curta 1. Frase curta 2. Frase curta 3.").

Regras estritas para o escopo de entregas ("description"):
- O escopo deve ser escrito como uma lista de 4 a 6 itens (entregáveis) separados por vírgula.
- Cada item deve ser detalhado, profissional e persuasivo para demonstrar alto valor e convencer o cliente (ex: em vez de apenas "Gestão de 2 plataformas", use "Gestão estratégica de anúncios em até 2 plataformas focada em escala de leads"; em vez de "relatório mensal", use "Envio de relatório mensal de performance com análise de métricas chaves e próximos passos").
- NUNCA use vírgulas internas dentro de um mesmo item (ex: use "8 posts mensais com foco em desejo e conversão", e NUNCA "8 posts mensais com foco em desejo, conversão"). Use conectores como "e", "com", "focado em" em vez de vírgulas dentro do mesmo item.
- Mantenha os limites numéricos originais estritamente iguais (por exemplo, se o texto original menciona "2 plataformas" ou "12 posts por mês" ou "2 reuniões por mês", mantenha esses números exatos).

Aqui estão os serviços a serem otimizados:
${JSON.stringify(servicesList, null, 2)}

Retorne a resposta EXATAMENTE no formato JSON abaixo, sem blocos de código markdown ou texto extra:
{
  "optimizedServices": [
    {
      "id": "id_do_servico",
      "description": "Lista de 4 a 6 itens detalhados de entrega separados apenas por vírgula (sem vírgulas internas dentro de cada item)."
    }
  ],
  "strategy": "Frase curta 1. Frase curta 2. Frase curta 3."
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Erro desconhecido na API.");
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text.trim();

    // Limpa delimitadores de código markdown se o modelo tiver retornado
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(text);

    if (!parsed.optimizedServices || !Array.isArray(parsed.optimizedServices) || parsed.optimizedServices.length === 0) {
      throw new Error("Formato de resposta retornado pela IA está incompleto.");
    }

    // Atualiza os inputs do formulário com os novos escopos otimizados
    parsed.optimizedServices.forEach(optSrv => {
      const card = document.querySelector(`.service-card-active[data-service="${optSrv.id}"]`);
      if (card) {
        const descInput = card.querySelector(".service-desc-input");
        if (descInput) {
          descInput.value = optSrv.description;
        }
      }
    });

    // Se a IA retornou a estratégia recomendada, atualiza o estado e o editor de texto na UI
    if (parsed.strategy) {
      proposalState.customStrategy = parsed.strategy;
      const strategyInput = document.getElementById("strategy-editor");
      if (strategyInput) {
        strategyInput.value = parsed.strategy;
      }
    }

    // Sincroniza o estado global e atualiza a visualização/PDF
    syncSelectedServices();
    updatePreview();

    // Feedback de sucesso rápido
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Escopos Otimizados!';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error("Erro na chamada do Gemini:", error);
    alert("Erro ao gerar conteúdo com a API do Gemini: " + error.message);
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

// ============================================================
// PERSISTÊNCIA: Auto-save, Load, SyncFieldsFromState
// ============================================================

let _autoSaveTimeout = null;
function saveToLocalStorage() {
  clearTimeout(_autoSaveTimeout);
  _autoSaveTimeout = setTimeout(() => {
    try {
      localStorage.setItem("rakta_proposal_state", JSON.stringify(proposalState));
      const indicator = document.getElementById("autosave-indicator");
      if (indicator) {
        indicator.style.display = "block";
        clearTimeout(indicator._hideTimer);
        indicator._hideTimer = setTimeout(() => { indicator.style.display = "none"; }, 3000);
      }
    } catch (e) {
      console.warn("Erro ao salvar no localStorage:", e);
    }
  }, 500);
}

function loadSavedState() {
  // Carrega tema salvo
  const savedTheme = localStorage.getItem("rakta_proposal_theme") || "red";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === savedTheme);
  });

  // Carrega estado salvo
  const savedStateStr = localStorage.getItem("rakta_proposal_state");
  if (savedStateStr) {
    try {
      const saved = JSON.parse(savedStateStr);
      if (saved && saved.clientName) {
        proposalState = { ...proposalState, ...saved };

        // Restaura serviços customizados no banco de dados em memória
        if (proposalState.selectedServices) {
          proposalState.selectedServices.forEach(s => {
            if (s.serviceId && s.serviceId.startsWith("custom_")) {
              const categoryId = s.categoryId;
              if (servicesData[categoryId]) {
                const alreadyExists = servicesData[categoryId].services.some(orig => orig.id === s.serviceId);
                if (!alreadyExists) {
                  servicesData[categoryId].services.push({
                    id: s.serviceId,
                    name: s.name,
                    isCustom: true,
                    levels: {
                      custom: {
                        name: s.period === "mês" ? "Nível Personalizado" : "Projeto Único",
                        price: s.price,
                        period: s.period,
                        recurring: s.recurring,
                        description: s.description
                      }
                    }
                  });
                }
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn("Erro ao carregar estado salvo:", e);
    }
  }

  // Garante inicialização das cláusulas e diretrizes customizadas
  if (!proposalState.contractClauses) {
    proposalState.contractClauses = { ...defaultClauses };
  } else {
    // Garante que se novas cláusulas forem adicionadas futuramente ao defaultClauses, elas existam no estado carregado
    proposalState.contractClauses = { ...defaultClauses, ...proposalState.contractClauses };
  }
  if (!proposalState.customGuidelines) {
    proposalState.customGuidelines = {};
  }
}

function syncFieldsFromState() {
  const el = id => document.getElementById(id);
  if (el("client-name-input")) el("client-name-input").value = proposalState.clientName || "";
  if (el("project-name-input")) el("project-name-input").value = proposalState.projectName || "";
  if (el("validity-input")) el("validity-input").value = proposalState.validityDays || 15;
  if (el("niche-name-input")) el("niche-name-input").value = proposalState.nicheName || "";
  if (el("pain-points-editor")) el("pain-points-editor").value = (proposalState.customPainPoints || []).join("\n");
  if (el("strategy-editor")) el("strategy-editor").value = proposalState.customStrategy || "";
  if (el("contract-term-input")) el("contract-term-input").value = proposalState.contractTerm || "";
  if (el("payment-terms-input")) el("payment-terms-input").value = proposalState.paymentTerms || "";
  if (el("setup-payment-input")) el("setup-payment-input").value = proposalState.setupPaymentTerms || "";
  if (el("media-investment-input")) el("media-investment-input").value = proposalState.mediaInvestment || "";
  if (el("work-start-input")) el("work-start-input").value = proposalState.workStart || "";
  if (el("proposal-notes-input")) el("proposal-notes-input").value = proposalState.proposalNotes || "";
  if (el("override-monthly-input")) el("override-monthly-input").value = proposalState.overrideMonthly !== null ? proposalState.overrideMonthly : "";
  if (el("override-oneoff-input")) el("override-oneoff-input").value = proposalState.overrideOneOffAndSetup !== null ? proposalState.overrideOneOffAndSetup : "";
  if (el("discount-monthly-input")) el("discount-monthly-input").value = proposalState.discountMonthly !== null ? proposalState.discountMonthly : "";
  if (el("discount-oneoff-input")) el("discount-oneoff-input").value = proposalState.discountOneOff !== null ? proposalState.discountOneOff : "";
  if (el("niche-select") && proposalState.niche) el("niche-select").value = proposalState.niche;

  // Sincroniza campos do contrato
  if (el("contract-company-input")) el("contract-company-input").value = proposalState.contractCompany || "";
  if (el("contract-cnpj-input")) el("contract-cnpj-input").value = proposalState.contractCNPJ || "";
  if (el("contract-phone-input")) el("contract-phone-input").value = proposalState.contractPhone || "";
  if (el("contract-address-input")) el("contract-address-input").value = proposalState.contractAddress || "";
  if (el("contract-rep-name-input")) el("contract-rep-name-input").value = proposalState.contractRepName || "";
  if (el("contract-rep-email-input")) el("contract-rep-email-input").value = proposalState.contractRepEmail || "";
  if (el("contract-due-day-rec-input")) el("contract-due-day-rec-input").value = proposalState.contractDueDayRec || 5;
  if (el("contract-payment-rec-select")) el("contract-payment-rec-select").value = proposalState.contractPaymentRec || "Boleto bancário";
  if (el("contract-payment-setup-select")) el("contract-payment-setup-select").value = proposalState.contractPaymentSetup || "Pix";
  if (el("contract-setup-installments-input")) el("contract-setup-installments-input").value = proposalState.contractSetupInstallments || 6;
  if (el("contract-start-date-input")) el("contract-start-date-input").value = proposalState.contractStartDate || "";

  // Sincroniza checkboxes de slides
  document.querySelectorAll(".slide-toggle").forEach(toggle => {
    const slideKey = toggle.dataset.slide;
    if (proposalState.includeSlides && proposalState.includeSlides[slideKey] !== undefined) {
      toggle.checked = proposalState.includeSlides[slideKey];
    }
  });
}

function rebuildActiveServiceCardsFromState() {
  if (!proposalState.selectedServices || proposalState.selectedServices.length === 0) return;

  proposalState.selectedServices.forEach(savedSvc => {
    const { categoryId, serviceId, levelId, price, description, recurring, isBonus } = savedSvc;
    if (!servicesData[categoryId]) return;
    const service = servicesData[categoryId].services.find(s => s.id === serviceId);
    if (!service) return;

    // Descobrir o groupId
    const firstLevelKey = Object.keys(service.levels)[0];
    const period = service.levels[firstLevelKey].period;
    const groupId = period === "mês" ? "recorrente" : "pontual";

    const activeList = document.getElementById(`active-list-${groupId}-${categoryId}`);
    if (!activeList) return;

    // Evita duplicação
    if (activeList.querySelector(`.service-card-active[data-service="${serviceId}"]`)) return;

    addServiceCard(categoryId, serviceId, groupId);

    // Restaura valores específicos no card
    const card = activeList.querySelector(`.service-card-active[data-service="${serviceId}"]`);
    if (!card) return;

    const levelSelect = card.querySelector(".service-level-select");
    if (levelSelect && levelId) levelSelect.value = levelId;

    const priceInput = card.querySelector(".service-price-input");
    if (priceInput && price !== undefined) priceInput.value = price;

    const descInput = card.querySelector(".service-desc-input");
    if (descInput && description) descInput.value = description;

    const recInput = card.querySelector(".service-recurring-input");
    if (recInput && recurring !== undefined) recInput.value = recurring;

    const bonusCheckbox = card.querySelector(".service-bonus-checkbox");
    if (bonusCheckbox) bonusCheckbox.checked = isBonus || false;
  });

  // Após reconstruir, limpa o selectedServices do estado e re-sincroniza para evitar duplicações
  syncSelectedServices();
}

// ============================================================
// SERVIÇO CUSTOMIZADO
// ============================================================

let customServiceCounter = 0;

function saveCustomService() {
  const name = document.getElementById("custom-service-name").value.trim();
  const type = document.getElementById("custom-service-type").value;
  const categoryId = document.getElementById("custom-service-category").value;
  const price = parseFloat(document.getElementById("custom-service-price").value) || 0;
  const recurring = parseFloat(document.getElementById("custom-service-recurring").value) || 0;
  const desc = document.getElementById("custom-service-desc").value.trim();

  if (!name) {
    alert("Por favor, insira um nome para o serviço.");
    return;
  }

  customServiceCounter++;
  const serviceId = `custom_${Date.now()}_${customServiceCounter}`;
  const period = type === "recorrente" ? "mês" : "projeto";

  const newService = {
    id: serviceId,
    name: name,
    isCustom: true,
    levels: {
      custom: {
        name: type === "recorrente" ? "Nível Personalizado" : "Projeto Único",
        price: price,
        period: period,
        recurring: recurring > 0 ? recurring : undefined,
        description: desc || "Entrega customizada conforme briefing acordado."
      }
    }
  };

  if (!servicesData[categoryId]) return;
  servicesData[categoryId].services.push(newService);

  // Re-renderiza o accordion para incluir o novo serviço no dropdown
  renderServicesSelector();

  // Adiciona o card automaticamente
  const groupId = type;
  setTimeout(() => {
    addServiceCard(categoryId, serviceId, groupId);
    // Abre o accordion do grupo correspondente
    const accordionContent = document.querySelector(`#services-accordion .accordion-category .accordion-content`);
    if (accordionContent) accordionContent.classList.remove("hidden");
  }, 100);

  document.getElementById("custom-service-form").classList.add("hidden");
  clearCustomServiceForm();
}

function clearCustomServiceForm() {
  const safe = id => { const el = document.getElementById(id); if (el) el.value = ""; };
  safe("custom-service-name");
  safe("custom-service-price");
  safe("custom-service-recurring");
  safe("custom-service-desc");
  const typeEl = document.getElementById("custom-service-type");
  if (typeEl) typeEl.value = "recorrente";
  const catEl = document.getElementById("custom-service-category");
  if (catEl) catEl.value = "performance";
}

// ============================================================
// IA: OTIMIZAÇÃO DE SERVIÇO INDIVIDUAL
// ============================================================

async function optimizeSingleService(catId, serviceId, btnEl) {
  const apiKeyInput = document.getElementById("gemini-api-key");
  const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
  if (!apiKey) {
    alert("Por favor, insira uma Chave de API do Gemini para otimizar com IA.");
    return;
  }

  const card = document.querySelector(`.service-card-active[data-service="${serviceId}"]`);
  if (!card) return;

  const descInput = card.querySelector(".service-desc-input");
  const currentDesc = descInput ? descInput.value : "";

  const originalHTML = btnEl.innerHTML;
  btnEl.disabled = true;
  btnEl.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';

  const toneSelect = document.getElementById("gemini-tone-select");
  const toneMap = {
    "persuasivo": "persuasivo e comercial — use linguagem que venda, com benefícios claros e gatilhos de valor",
    "tecnico": "técnico e detalhado — seja preciso, formal e use terminologia especializada de marketing",
    "direto": "direto e minimalista — seja conciso, objetivo e evite floreios"
  };
  const selectedTone = toneSelect ? toneSelect.value : "persuasivo";
  const toneDescription = toneMap[selectedTone] || toneMap["persuasivo"];

  const service = servicesData[catId]?.services.find(s => s.id === serviceId);
  const serviceName = service ? service.name : serviceId;

  const prompt = `Você é um copywriter sênior de marketing digital da Rakta Digital. Tom: ${toneDescription}.
Reescreva o escopo de entregas abaixo do serviço "${serviceName}" para o cliente "${proposalState.clientName}" que atua no nicho "${proposalState.nicheName}".

Escopo atual: "${currentDesc}"

Regras:
- Retorne uma lista de 4 a 6 entregáveis separados por vírgula.
- Cada item deve ser detalhado, profissional e demonstrar alto valor.
- NUNCA use vírgulas dentro de um mesmo item. Use "e", "com", "focado em" como conectores.
- Mantenha os limites numéricos originais (plataformas, posts por mês, etc).

Retorne SOMENTE a string dos entregáveis, sem JSON, sem listas com hífens, sem markdown.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Erro desconhecido na API.");
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text.trim();
    text = text.replace(/^```[\w]*\n?/i, "").replace(/```$/, "").trim();

    if (descInput) {
      descInput.value = text;
      syncSelectedServices();
      updatePreview();
    }

    btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => { btnEl.innerHTML = originalHTML; btnEl.disabled = false; }, 2000);

  } catch (err) {
    console.error("Erro ao otimizar serviço individual:", err);
    alert("Erro ao otimizar: " + err.message);
    btnEl.innerHTML = originalHTML;
    btnEl.disabled = false;
  }
}

// ============================================================
// IA: OTIMIZAÇÃO DE CLÁUSULAS E DIRETRIZES
// ============================================================

async function optimizeContractClause() {
  const select = document.getElementById("contract-clause-select");
  const promptInput = document.getElementById("contract-clause-prompt");
  const btn = document.getElementById("btn-optimize-clause");

  if (!select || !promptInput || !btn) return;

  const selectedKey = select.value;
  const userInstruction = promptInput.value.trim();

  if (!userInstruction) {
    alert("Por favor, insira uma instrução para a IA.");
    return;
  }

  const apiKeyInput = document.getElementById("gemini-api-key");
  const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
  if (!apiKey) {
    alert("Por favor, insira uma Chave de API do Gemini para otimizar com IA.");
    return;
  }

  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Otimizando...';

  try {
    let promptText = "";
    const isGuideline = selectedKey.startsWith("guideline_");

    if (!isGuideline) {
      // É uma cláusula contratual (ex: clause3, clause7, etc.)
      const originalClauseText = (proposalState.contractClauses && proposalState.contractClauses[selectedKey]) || defaultClauses[selectedKey];
      
      promptText = `Você é um advogado especialista em contratos comerciais e marketing digital.
Sua única tarefa é reescrever a cláusula contratual fornecida abaixo, aplicando estritamente a instrução do usuário.

Cláusula original (contém tags HTML como <p>, <span>, etc. que devem ser PRESERVADAS na mesma estrutura):
"""
${originalClauseText}
"""

Instrução de alteração do usuário:
"${userInstruction}"

Regras cruciais:
1. NÃO invente novos direitos, deveres, prazos, multas ou termos adicionais além do que foi explicitamente solicitado pelo usuário.
2. Limite-se estritamente a aplicar a instrução solicitada, mantendo o restante da cláusula exatamente igual ao texto original.
3. Preserve todas as tags HTML (como <p>, <span>, <strong>, etc.) e classes (como class="c1 c2") exatamente no mesmo lugar.
4. Mantenha a linguagem formal, clara e em conformidade com o padrão da cláusula original.
5. Retorne APENAS o HTML da cláusula modificada, sem qualquer tipo de markdown (não coloque cercas de código \`\`\`), sem introdução e sem explicações.`;
    } else {
      // É uma diretriz relevante (ex: guideline_google_meu_negocio)
      const serviceId = selectedKey.replace("guideline_", "");
      
      // Encontra o serviço selecionado e suas diretrizes atuais
      const service = proposalState.selectedServices.find(s => s.serviceId === serviceId);
      const serviceName = service ? service.name : serviceId;

      // Obtém as diretrizes atuais (custom ou padrão)
      let currentGuidelines = [];
      if (proposalState.customGuidelines && proposalState.customGuidelines[serviceId]) {
        currentGuidelines = proposalState.customGuidelines[serviceId];
      } else {
        // Fallback para as diretrizes padrão
        if (serviceGuidelines[serviceId]) {
          currentGuidelines = serviceGuidelines[serviceId];
        } else {
          const mockActive = getContractModules([{ serviceId: serviceId, categoryId: service?.categoryId || "", name: serviceName, description: "" }]);
          currentGuidelines = (mockActive && mockActive[0]) ? mockActive[0].guidelines : [];
        }
      }

      promptText = `Você é um assistente de operações e contratos de marketing digital da agência Rakta Digital.
Sua única tarefa é alterar a lista de Diretrizes Relevantes do serviço de marketing abaixo, aplicando estritamente a instrução do usuário.

Diretrizes originais:
${currentGuidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Instrução de alteração do usuário:
"${userInstruction}"

Regras cruciais:
1. NÃO invente novos prazos, obrigações, multas, regras ou limitações que não constem no texto original ou na instrução.
2. Limite-se estritamente a adaptar, remover ou atualizar as diretrizes conforme a instrução do usuário. Se o usuário pedir para remover um item, apenas delete-o e mantenha os demais intocados.
3. Retorne o resultado em formato de lista simples, onde cada diretriz está em uma nova linha.
4. NUNCA utilize números de itens (como "1.", "2."), marcadores (como "-", "*", "•"), hífens ou qualquer tipo de formatação markdown (como negrito ou itálico) no início das linhas. Cada linha deve ser puramente o texto da diretriz.
5. Retorne APENAS o conteúdo das diretrizes, sem explicações, comentários, introduções ou notas de rodapé.`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Erro desconhecido na API do Gemini.");
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text.trim();
    
    // Limpa possíveis marcações de código markdown do Gemini
    text = text.replace(/^```[\w]*\n?/i, "").replace(/```$/, "").trim();

    if (!isGuideline) {
      // Salva a cláusula reescrita
      if (!proposalState.contractClauses) {
        proposalState.contractClauses = { ...defaultClauses };
      }
      proposalState.contractClauses[selectedKey] = text;
    } else {
      const serviceId = selectedKey.replace("guideline_", "");
      // Divide por quebra de linha, filtra linhas vazias e remove números/hífens residuais do início de cada linha
      const lines = text.split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          return line.replace(/^(\d+\s*[\.\-]\s*|[\-\*\u2022]\s*)/i, "").trim();
        });

      if (!proposalState.customGuidelines) {
        proposalState.customGuidelines = {};
      }
      proposalState.customGuidelines[serviceId] = lines;
    }

    saveToLocalStorage();
    updateContractPreview();
    promptInput.value = ""; // Limpa prompt após sucesso

    btn.innerHTML = '<i class="fa-solid fa-check"></i> Sucesso!';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }, 2000);

  } catch (err) {
    console.error("Erro ao otimizar cláusula/diretriz:", err);
    alert("Erro ao otimizar: " + err.message);
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

function resetContractClause() {
  const select = document.getElementById("contract-clause-select");
  if (!select) return;

  const selectedKey = select.value;
  if (!selectedKey) return;

  if (confirm("Tem certeza que deseja restaurar o texto padrão da Rakta para este item?")) {
    const isGuideline = selectedKey.startsWith("guideline_");
    if (!isGuideline) {
      if (!proposalState.contractClauses) {
        proposalState.contractClauses = { ...defaultClauses };
      }
      proposalState.contractClauses[selectedKey] = defaultClauses[selectedKey];
    } else {
      const serviceId = selectedKey.replace("guideline_", "");
      if (!proposalState.customGuidelines) {
        proposalState.customGuidelines = {};
      }
      delete proposalState.customGuidelines[serviceId];
    }

    saveToLocalStorage();
    updateContractPreview();

    const btnReset = document.getElementById("btn-reset-clause");
    if (btnReset) {
      const origText = btnReset.innerHTML;
      btnReset.innerHTML = '<i class="fa-solid fa-check"></i> Restaurado!';
      setTimeout(() => { btnReset.innerHTML = origText; }, 2000);
    }
  }
}

// ============================================================
// NAVEGAÇÃO DE SLIDES / MODO APRESENTAÇÃO
// ============================================================

let currentSlideIndex = 0;

function showCurrentSlideOnly() {
  const slides = document.querySelectorAll("#slides-preview .slide-wrapper");
  const total = slides.length;
  if (total === 0) return;

  if (currentSlideIndex >= total) currentSlideIndex = total - 1;
  if (currentSlideIndex < 0) currentSlideIndex = 0;

  slides.forEach((slide, i) => {
    slide.style.display = i === currentSlideIndex ? "block" : "none";
  });

  const indicator = document.getElementById("slide-nav-indicator");
  if (indicator) indicator.textContent = `${currentSlideIndex + 1}/${total}`;
}

function navigateSlide(direction) {
  const slides = document.querySelectorAll("#slides-preview .slide-wrapper");
  const total = slides.length;
  if (total === 0) return;

  currentSlideIndex = Math.max(0, Math.min(total - 1, currentSlideIndex + direction));
  showCurrentSlideOnly();
}

function toggleFullscreenSlides() {
  const slidesContainer = document.getElementById("slides-preview");
  const btn = document.getElementById("btn-fullscreen-presentation");

  if (!document.fullscreenElement) {
    slidesContainer.requestFullscreen().then(() => {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-compress"></i> Sair';
    }).catch(err => {
      console.warn("Erro ao entrar em tela cheia:", err);
    });
  } else {
    document.exitFullscreen().then(() => {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-expand"></i> Tela Cheia';
    });
  }
}

// Restaura o botão de tela cheia quando o navegador sai do fullscreen via ESC
document.addEventListener("fullscreenchange", () => {
  const btn = document.getElementById("btn-fullscreen-presentation");
  if (!document.fullscreenElement && btn) {
    btn.innerHTML = '<i class="fa-solid fa-expand"></i> Tela Cheia';
  }
});

// ============================================================
// CONTRATO GENERATION HELPERS
// ============================================================

function calculateTotals() {
  const monthlyServices = proposalState.selectedServices.filter(s => s.period === "mês");
  const projectServices = proposalState.selectedServices.filter(s => s.period === "projeto");
  const setupServices = proposalState.selectedServices.filter(s => s.period === "setup");

  // Ordena os serviços por bônus primeiro e depois por categoria
  const categoryOrder = ["performance", "branding", "digital", "tecnologia", "crm", "consultoria"];
  const sortByBonusAndCategory = (a, b) => {
    if (a.isBonus && !b.isBonus) return -1;
    if (!a.isBonus && b.isBonus) return 1;
    return categoryOrder.indexOf(a.categoryId) - categoryOrder.indexOf(b.categoryId);
  };

  monthlyServices.sort(sortByBonusAndCategory);
  projectServices.sort(sortByBonusAndCategory);
  setupServices.sort(sortByBonusAndCategory);

  const autoMonthly = monthlyServices.reduce((sum, s) => sum + (s.isBonus ? 0 : s.price), 0) + setupServices.reduce((sum, s) => sum + (s.isBonus ? 0 : s.recurring), 0);
  const autoOneOffAndSetup = projectServices.reduce((sum, s) => sum + (s.isBonus ? 0 : s.price), 0) + setupServices.reduce((sum, s) => sum + (s.isBonus ? 0 : s.price), 0);

  let baseMonthly = autoMonthly;
  if (proposalState.overrideMonthly !== null && proposalState.overrideMonthly !== undefined && !isNaN(proposalState.overrideMonthly)) {
    baseMonthly = proposalState.overrideMonthly;
  }
  let totalMonthly = baseMonthly;
  if (proposalState.discountMonthly !== null && proposalState.discountMonthly !== undefined && !isNaN(proposalState.discountMonthly)) {
    totalMonthly = Math.max(0, baseMonthly - proposalState.discountMonthly);
  }

  let baseOneOffAndSetup = autoOneOffAndSetup;
  if (proposalState.overrideOneOffAndSetup !== null && proposalState.overrideOneOffAndSetup !== undefined && !isNaN(proposalState.overrideOneOffAndSetup)) {
    baseOneOffAndSetup = proposalState.overrideOneOffAndSetup;
  }
  let totalOneOffAndSetup = baseOneOffAndSetup;
  if (proposalState.discountOneOff !== null && proposalState.discountOneOff !== undefined && !isNaN(proposalState.discountOneOff)) {
    totalOneOffAndSetup = Math.max(0, baseOneOffAndSetup - proposalState.discountOneOff);
  }

  return {
    autoMonthly,
    autoOneOffAndSetup,
    baseMonthly,
    baseOneOffAndSetup,
    totalMonthly,
    totalOneOffAndSetup,
    monthlyServices,
    projectServices,
    setupServices
  };
}

const serviceGuidelines = {
  'google_meu_negocio': [
    "O CONTRATANTE é responsável por fornecer fotos e informações reais da fachada, horário de funcionamento e contatos atualizados para o preenchimento do perfil.",
    "A postagem de atualizações e a resposta às avaliações seguirão o cronograma do nível de serviço contratado.",
    "O posicionamento e ranqueamento local dependem exclusivamente dos algoritmos do Google, não havendo garantia de posicionamento na primeira colocação nas buscas orgânicas locais.",
    "O CONTRATANTE compromete-se a incentivar ativamente que seus clientes façam avaliações no perfil para fins de melhoria de ranqueamento."
  ],
  'video_maker': [
    "O CONTRATANTE deverá agendar as datas de captação presencial com no mínimo 7 (sete) dias de antecedência, sujeito a disponibilidade de agenda da CONTRATADA.",
    "Cada sessão de captação terá a duração limite definida no escopo do nível de serviço contratado, sendo cobrada taxa de hora adicional caso exceda o período pactuado.",
    "Os custos de deslocamento, alimentação e eventuais taxas de locação de locações externas para captação são de exclusiva responsabilidade do CONTRATANTE.",
    "O prazo de edição de cada vídeo começa a contar a partir do recebimento completo de todos os arquivos brutos e do roteiro aprovado.",
    "O backup dos arquivos brutos gerados ficará armazenado pela CONTRATADA pelo período improrrogável de 30 (trinta) dias após a captação."
  ],
  'branding_marca': [
    "O projeto de Branding é dividido nas etapas de Briefing, Pesquisa, Apresentação da Marca e Entrega do Brandbook, devendo o CONTRATANTE validar cada fase antes do avanço para a seguinte.",
    "As rodadas de alteração e refação permitidas no projeto são limitadas ao número de revisões estabelecido no escopo contratado.",
    "Após a aprovação final e entrega dos arquivos vetoriais e do Brandbook, eventuais solicitações de desdobramento de novos materiais serão orçadas como serviço avulso.",
    "O CONTRATANTE é o único responsável legal por realizar a pesquisa de anterioridade e o registro da marca junto ao INPI (Instituto Nacional da Propriedade Industrial)."
  ],
  'rebranding': [
    "O Rebranding envolve o redesenho da marca existente e sua transição tática, dependendo do fornecimento prévio pelo CONTRATANTE de todos os arquivos editáveis da marca atual.",
    "A aprovação do Rebranding é realizada em etapas formais, e alterações substanciais solicitadas após o fechamento de uma etapa estarão sujeitas a custos extras de retrabalho.",
    "A implementação física e digital da nova identidade em sites, redes sociais e fachadas externas observará o planejamento de transição acordado pelas partes."
  ],
  'site_institucional': [
    "O desenvolvimento do site institucional requer o fornecimento completo pelo CONTRATANTE das copys, fotos, logos e credenciais de acesso em até 10 (dez) dias após o kickoff.",
    "A contratação e manutenção do domínio (URL) e do servidor de hospedagem são de exclusiva responsabilidade financeira e operacional do CONTRATANTE.",
    "O site será entregue com otimização básica de velocidade de carregamento e compatibilidade mobile, conforme boas práticas de mercado.",
    "Após a entrega e homologação do site, o CONTRATANTE terá um prazo de 15 (quinze) dias corridos para apontar ajustes de erros de programação, findo o qual o site será considerado plenamente aceito."
  ],
  'ecommerce': [
    "O CONTRATANTE é responsável pelo cadastro dos produtos (títulos, descrições, preços e fotos), bem como pelas configurações fiscais, de frete e de meios de pagamento.",
    "O desenvolvimento do e-commerce inclui a integração com as plataformas de pagamento e envio definidas no escopo, estando a operacionalidade sujeita aos termos e taxas dessas plataformas.",
    "A CONTRATADA não se responsabiliza por eventuais perdas financeiras decorrentes de falhas de processamento de checkout de terceiros ou fraudes em compras efetuadas na loja virtual.",
    "O CONTRATANTE deverá garantir a segurança jurídica e os termos de uso do e-commerce, incluindo políticas de troca e privacidade (LGPD)."
  ],
  'manutencao_recorrente': [
    "A manutenção recorrente cobre correções de bugs, atualizações de plugins e pequenos ajustes de layout no site, excluindo a criação de novas páginas ou novos sistemas complexos.",
    "Os chamados de suporte técnico serão respondidos e priorizados de acordo com o SLA definido no escopo de serviço.",
    "A CONTRATADA realizará backups periódicos de segurança, mas não se responsabiliza por perdas de dados decorrentes de invasões, falhas graves no servidor de hospedagem do cliente ou exclusão acidental por parte do cliente."
  ],
  'seo_conteudo': [
    "O CONTRATANTE fica ciente de que as estratégias de SEO (Search Engine Optimization) visam a melhoria orgânica de longo prazo, não havendo garantia de prazos para atingimento da primeira página nos mecanismos de busca.",
    "A produção de artigos e conteúdos utilizará ferramentas de IA integradas à revisão humana, devendo os temas e textos serem validados previamente pelo CONTRATANTE.",
    "A implementação das melhorias técnicas de SEO on-page no site do CONTRATANTE depende da liberação de acessos administrativos adequados à plataforma do site."
  ],
  'integracao_api': [
    "A integração de APIs depende da estabilidade, documentação técnica clara e liberação de acessos às APIs dos sistemas de terceiros (CRMs, ERPs, gateways de pagamento).",
    "A CONTRATADA não se responsabiliza por interrupções no funcionamento das automações decorrentes de atualizações, mudanças estruturais ou instabilidades técnicas nas APIs desses fornecedores externos.",
    "Eventuais custos de assinatura ou taxas de uso de plataformas de automação (como Make, Zapier, n8n) ou das próprias APIs integradas são de responsabilidade financeira exclusiva do CONTRATANTE."
  ],
  'app_mobile': [
    "O desenvolvimento de aplicativos mobile seguirá as etapas de design de interface (UI/UX), codificação, homologação e publicação nas lojas oficiais (Google Play e Apple App Store).",
    "As taxas de abertura e manutenção de contas de desenvolvedor na Google Play e Apple App Store são de inteira responsabilidade financeira do CONTRATANTE.",
    "O CONTRATANTE declara ciência de que o prazo de aprovação e publicação do aplicativo nas lojas é determinado exclusivamente pelas políticas e tempos de análise do Google e da Apple.",
    "Alterações substanciais de escopo solicitadas após a fase de design de interface (UI/UX) aprovada ensejarão na revisão de custos e prazos do projeto."
  ],
  'plataforma_web': [
    "O desenvolvimento de plataformas web personalizadas requer a elaboração conjunta e aprovação do documento de especificação técnica de requisitos e jornada do usuário antes do início do desenvolvimento.",
    "A hospedagem e a infraestrutura de servidores em nuvem (AWS, Firebase, Vercel) necessárias para rodar a plataforma serão contratadas em nome e com custos pagos diretamente pelo CONTRATANTE.",
    "A garantia para correção de eventuais bugs ou falhas de programação pós-entrega será de 30 (trinta) dias corridos a partir da data de homologação da plataforma."
  ],
  'nocode_lowcode': [
    "O desenvolvimento utilizando ferramentas No-code ou Low-code (como FlutterFlow, Bubble, Webflow) visa a entrega ágil de sistemas, estando a plataforma sujeita aos limites técnicos dessas ferramentas.",
    "O CONTRATANTE é responsável pelo pagamento direto das mensalidades das plataformas No-code utilizadas para hospedar e rodar a aplicação.",
    "A exportação do código-fonte ou migração para outras linguagens de programação tradicionais pode ser limitada ou inexistente, conforme as regras da plataforma No-code escolhida."
  ],
  'assessoria_growth': [
    "Para a análise de KPIs como LTV e CAC, o CONTRATANTE compromete-se a fornecer acesso total a dados de faturamento, CRM e ferramentas de vendas, garantindo a integridade das informações prestadas.",
    "O serviço de Growth é uma obrigação de meio. A CONTRATADA recomenda estratégias baseadas em dados, mas o sucesso depende da execução comercial e da saúde financeira do negócio do CONTRATANTE.",
    "A presença do CONTRATANTE ou de seu tomador de decisão na reunião mensal é obrigatória. A ausência sistemática poderá comprometer o ajuste de rota e as metas de escala.",
    "A CONTRATADA atua na estratégia e análise; a execução operacional das recomendações (ex: alteração em processos de vendas internos) cabe à equipe do CONTRATANTE."
  ],
  'transformacao_digital': [
    "A consultoria em transformação digital envolve o mapeamento de processos internos, recomendação de ferramentas e planejamento de migração tecnológica para a empresa do CONTRATANTE.",
    "A efetiva adesão e treinamento dos colaboradores do CONTRATANTE aos novos sistemas indicados constitui fator essencial para o sucesso do projeto.",
    "A CONTRATADA não se responsabiliza por eventuais perdas operacionais decorrentes da fase de transição de sistemas antigos para os novos sistemas implementados."
  ],
  'hora_avulsa': [
    "As horas avulsas de suporte ou programação deverão ser utilizadas para demandas específicas pré-aprovadas pelas partes, sendo contabilizadas mediante ferramenta de controle de tempo (time tracking).",
    "O prazo de atendimento de solicitações de horas avulsas está sujeito à fila de prioridades e à capacidade técnica de alocação da CONTRATADA no momento do chamado.",
    "As horas contratadas têm validade limite de 30 (trinta) dias corridos após a contratação, não sendo cumulativas ou reembolsáveis em caso de não utilização."
  ]
};

function getContractModules(selectedServices) {
  const serviceToModuleKey = {
    'midia_paga': 'trafego',
    'google_meu_negocio': 'trafego',
    'social_media': 'social',
    'video_maker': 'social',
    'criativos_anuncios': 'criativos',
    'branding_marca': 'criativos',
    'rebranding': 'criativos',
    'site_institucional': 'web',
    'landing_page': 'web',
    'ecommerce': 'web',
    'manutencao_recorrente': 'web',
    'seo_conteudo': 'web',
    'bi_dashboards': 'bi',
    'gestao_crm': 'crm',
    'jornada_relacionamento': 'crm',
    'chatbot_ia': 'ia',
    'agentes_ia': 'ia',
    'consultoria_ia': 'ia',
    'integracao_api': 'automacoes',
    'app_mobile': 'automacoes',
    'plataforma_web': 'automacoes',
    'nocode_lowcode': 'automacoes',
    'assessoria_growth': 'automacoes',
    'transformacao_digital': 'automacoes',
    'hora_avulsa': 'automacoes'
  };

  const modules = {
    trafego: {
      name: "Gestão de Tráfego Pago",
      desc: "Planejamento estratégico + Estruturação de públicos + Gestão de campanhas (Meta Ads, Google Ads, Linkedin Ads, Tiktok Ads) + Otimizações contínuas + Tagueamento e Mensuração (Pixels, Tags, GA4, GTM) + Relatórios periódicos.",
      guidelines: [
        "O CONTRATANTE deverá fazer o adimplemento dos valores de mídia designados, conforme planejamento previamente aprovado.",
        "O CONTRATANTE fica ciente que a ausência ou atraso no pagamento do investimento de mídia poderá prejudicar a performance do anúncio, nada podendo exigir da CONTRATADA em relação a isso.",
        "O CONTRATANTE fica ciente que tanto o Google Ads quanto às demais redes sociais têm políticas rigorosas sobre o que é permitido nos anúncios, que mudam com periodicidade não previsível. Eventuais restrições poderão ocorrer, cabendo à CONTRATADA adotar as melhores medidas para retomar a performance padrão do perfil.",
        "O CONTRATANTE fica ciente que a performance das campanhas pode ser afetada por diversas variáveis, constituindo a responsabilidade da CONTRATADA como obrigação de meio.",
        "O CONTRATANTE é responsável pelo fornecimento do serviço e/ou produto comercializado diretamente, devendo garantir o atendimento da demanda dos seus clientes.",
        "O CONTRATANTE fica ciente que eventuais modificações independentes nas suas plataformas de gestão de mídia, sem autorização expressa da CONTRATADA, poderá resultar em prejuízos ao desempenho das campanhas.",
        "O CONTRATANTE pagará o valor fixo da mensalidade (fee) descrita neste contrato enquanto o percentual de investimento de mídia for menor que o valor do fee. Quando a porcentagem de investimento de mídia ultrapassar o fee, passará a pagar exclusivamente variável pelo investimento, na seguinte proporção: a) até R$ 40.000,00 de mídia pagará 20% de variável; b) de R$ 40.000,00 até R$ 80.000,00 de mídia pagará 18% de variável; c) de R$ 80.000,00 até R$ 500.000,00 de mídia pagará 13% de variável; d) acima de R$ 500.000,00 de mídia pagará 10% de variável.",
        "O escopo deste entregável é operado mensalmente, observando as estratégias designadas ao projeto."
      ],
      services: []
    },
    automacoes: {
      name: "Desenvolvimento / Automações",
      desc: "Integração com CRM + Criação de fluxos de qualificação + Organização e roteamento de leads + Mensagens automáticas de reforço e nutrição + Automações comerciais personalizadas",
      guidelines: [
        "Taxa de Implementação: constitui o custo para implementação da estrutura para recebimento do serviço contratado, correspondendo à fase inicial da estruturação do projeto. Nesta fase, poderá não ocorrer entregas, uma vez que se destina à estruturação do projeto.",
        "O CONTRATANTE fica ciente que, independentemente da plataforma, a implementação dependerá de envio de informações por sua parte e colaboração na estruturação, sendo que eventuais atrasos no fluxo de informações poderão implicar em prejuízos na implementação, que não poderão ser imputados à CONTRATADA.",
        "O CONTRATANTE fica ciente que a integração com APIs externas ou sistemas de terceiros pode estar sujeita a falhas técnicas, interrupções de serviço ou alterações inesperadas nas APIs, devendo ser dada prioridade para os sistemas parceiros da CONTRATADA.",
        "O escopo deste entregável é operado por pacote contratado, sendo as datas específicas de entregas pactuadas entre as partes."
      ],
      services: []
    },
    social: {
      name: "Social Media",
      desc: "Calendário Editorial + Cronograma de posts + Gestão de redes sociais (Instagram, Facebook, LinkedIn, TikTok)",
      guidelines: [
        "O CONTRATANTE deverá fornecer as informações e imagens brutas para confecção do material de publicação, responsabilizando-se pelos direitos autorais e de propriedade intelectual.",
        "O CONTRATANTE deverá aprovar, previamente, todos os conteúdos produzidos, ficando ciente que sua aprovação é condicionante para veiculação do material.",
        "A presença do cliente nas reuniões é essencial para o sucesso do projeto, constituindo sua ausência ou inatividade falta grave passível de rescisão por justo motivo.",
        "O CONTRATANTE fica ciente que o planejamento estrutural trimestral deverá ser respeitado para alcançar os objetivos do projeto.",
        "O escopo deste entregável é operado mensalmente, observando as estratégias designadas ao projeto."
      ],
      services: []
    },
    criativos: {
      name: "Design / Copywriting (Criativos)",
      desc: "Criativos Estáticos + Vídeos + Copywritings + Pequenas alterações ou variações + A/B Testing de criativos",
      guidelines: [
        "O CONTRATANTE deverá fornecer as informações e imagens brutas para confecção do material de publicidade, responsabilizando-se pelos direitos autorais e de propriedade intelectual decorrentes dos dados passados.",
        "O CONTRATANTE deverá aprovar, previamente, todas as artes e textos produzidos, ficando ciente que sua aprovação é condicionante para veiculação do material.",
        "A refação de material será oportunizada somente em caso de erro material no texto ou informação veiculada na arte.",
        "O CONTRATANTE fica ciente que as artes observam parâmetros e boas práticas de mercado que visam atrair a atenção do público alvo e cumprir as políticas das plataformas digitais.",
        "O CONTRATANTE fica ciente que será buscado respeitar a sua identidade visual, não necessariamente a arte mais elaborada.",
        "Os textos elaborados (copywriting) terão por objetivo a promoção de vendas e a estratégia designada para o projeto, não sendo objetivo da entrega a construção de textos técnicos ou informativos.",
        "O escopo deste entregável é operado mensalmente, observando as estratégias designadas ao projeto."
      ],
      services: []
    },
    web: {
      name: "Desenvolvimento Web (Landing Pages / Ambiente Digital)",
      desc: "Criação de Landing Pages + Testes A/B/C + Desenvolvimento de Copywriting + Manutenção de sites",
      guidelines: [
        "Taxa de Implementação: constitui o custo para implementação da estrutura para recebimento do serviço contratado, correspondendo à fase inicial da estruturação do projeto.",
        "O CONTRATANTE deverá disponibilizar informações para construção do site, conforme requisição da CONTRATADA.",
        "O CONTRATANTE declara ciência de que a confecção do site poderá depender de um período prévio de recolhimento de informações, o que poderá importar em ajustes em seu prazo de entrega.",
        "Eventuais modificações do site, após a entrega, somente serão realizadas para correção de erros de automação e/ou erros de ordem material.",
        "O CONTRATANTE fica ciente que a manutenção do site ficará condicionada ao pagamento contínuo do fee estabelecido.",
        "A integração com APIs externas ou sistemas de terceiros pode estar sujeita a falhas técnicas, interrupções de serviço ou alterações inesperadas.",
        "O escopo deste entregável é operado por pacote contratado, sendo as datas específicas de entregas pactuadas entre as partes."
      ],
      services: []
    },
    bi: {
      name: "BI / Análise de Dados (Dashboard de Performance)",
      desc: "Horas de Setup + Horas de Manutenção + Quota de Infraestrutura + Dashboards personalizados",
      guidelines: [
        "Taxa de Implementação: constitui o custo para implementação da estrutura de dashboard, correspondendo à fase inicial da estruturação do projeto.",
        "O CONTRATANTE deverá disponibilizar informações para construção dos dashboards, conforme requisição da CONTRATADA.",
        "O CONTRATANTE declara ciência de que a confecção do BI poderá depender de um período prévio de recolhimento de informações.",
        "Eventuais modificações do BI, após a entrega, somente serão realizadas para correção de erros de automação e/ou erros de ordem material.",
        "O uso dos dados fornecidos pelo CONTRATANTE observarão as diretrizes de proteção de dados, prezando sempre pela anonimização e/ou divulgação restrita das informações.",
        "O escopo deste entregável é operado por pacote contratado."
      ],
      services: []
    },
    crm: {
      name: "CRM Marketing",
      desc: "Setup Inicial + Construção de réguas / disparos pontuais + Otimização + Criativos + Copywritings + Lead Scoring",
      guidelines: [
        "Taxa de Implementação: constitui o custo para implementação da estrutura para recebimento do serviço de CRM contratado.",
        "O CONTRATANTE fica ciente que a contratação de cada frente de CRM deverá ser realizada profissionalmente e que a contratação de uma ferramenta não dá, automaticamente, o direito de utilização de outra.",
        "A implementação dependerá de envio de informações pelo CONTRATANTE e colaboração na estruturação.",
        "O CONTRATANTE fica ciente que os textos elaborados (copywriting) terão por objetivo a promoção de vendas e a estratégia designada para o projeto.",
        "O uso dos dados fornecidos pelo CONTRATANTE observarão as diretrizes de proteção de dados, viabilizando o descadastramento dos terceiros sempre que solicitado, por atendimento à LGPD.",
        "O projeto passará por 2 etapas: 1ª Setup (configuração inicial, mapeamento de tags, lead scoring) e 2ª Construção de Réguas (Planejamento, Comunicação, Automação e Otimização).",
        "O escopo deste entregável é operado por pacote contratado."
      ],
      services: []
    },
    ia: {
      name: "Inteligência Artificial (IA)",
      desc: "Implementação de soluções de IA + Automações inteligentes + Chatbots + Análise preditiva + Personalização de experiência do usuário",
      guidelines: [
        "Taxa de Implementação: constitui o custo para implementação e configuração das soluções de inteligência artificial, correspondendo à fase inicial de estruturação.",
        "O CONTRATANTE fica ciente que as soluções de IA dependem de dados de qualidade para funcionamento adequado, sendo de responsabilidade do CONTRATANTE o fornecimento de dados íntegros e atualizados.",
        "O CONTRATANTE fica ciente que ferramentas de IA de terceiros (como OpenAI, Google, Meta, entre outras) podem sofrer alterações em seus termos de uso, preços e funcionalidades, não sendo de responsabilidade da CONTRATADA eventuais impactos decorrentes dessas alterações.",
        "O CONTRATANTE fica ciente que resultados gerados por inteligência artificial são probabilísticos e dependem de múltiplas variáveis, não havendo garantia de resultados específicos.",
        "O CONTRATANTE é responsável por validar e aprovar todo conteúdo gerado por IA antes de sua publicação ou utilização comercial.",
        "O escopo deste entregável é operado por pacote contratado, sendo as datas específicas pactuadas entre as partes."
      ],
      services: []
    }
  };

  const result = [];
  selectedServices.forEach(s => {
    const key = serviceToModuleKey[s.serviceId] || serviceToModuleKey[s.categoryId] || 'automacoes';
    if (modules[key]) {
      const moduleTemplate = modules[key];
      const guidelines = (proposalState.customGuidelines && proposalState.customGuidelines[s.serviceId]) || serviceGuidelines[s.serviceId] || moduleTemplate.guidelines;
      result.push({
        name: s.name,
        desc: s.description,
        guidelines: guidelines,
        services: [s]
      });
    }
  });

  return result;
}

function numberToPortugueseWords(num) {
  const words = {
    1: "um", 2: "dois", 3: "três", 4: "quatro", 5: "cinco",
    6: "seis", 7: "sete", 8: "oito", 9: "nove", 10: "dez",
    11: "onze", 12: "doze", 13: "treze", 14: "quatorze", 15: "quinze",
    16: "dezesseis", 17: "dezessete", 18: "dezoito", 19: "dezenove", 20: "vinte",
    21: "vinte e um", 22: "vinte e dois", 23: "vinte e três", 24: "vinte e quatro",
    25: "vinte e cinco", 26: "vinte e seis", 27: "vinte e sete", 28: "vinte e oito",
    29: "vinte e nove", 30: "trinta", 45: "quarenta e cinco", 60: "sessenta",
    90: "noventa"
  };
  return words[num] || num.toString();
}

function updateContractPreview() {
  const container = document.getElementById("contract-preview");
  if (!container) return;

  const totals = calculateTotals();
  const hasImplementacao = totals.totalOneOffAndSetup > 0;
  const hasRecurrencia = totals.totalMonthly > 0;
  const activeModules = getContractModules(proposalState.selectedServices);

  const formatDate = (dateStr) => {
    if (!dateStr) return "___/___/______";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "___/___/______";
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const getMonthName = (monthIndex) => {
    const months = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    return months[monthIndex];
  };

  const today = new Date();
  const formattedToday = `${today.getDate()} de ${getMonthName(today.getMonth())} de ${today.getFullYear()}`;

  const clientName = proposalState.clientName || "________________________";
  const contractCompany = proposalState.contractCompany || clientName;
  const contractCNPJ = proposalState.contractCNPJ || "________________________";
  const contractPhone = proposalState.contractPhone || "________________________";
  const contractAddress = proposalState.contractAddress || "________________________";
  const contractRepName = proposalState.contractRepName || "________________________";
  const contractRepEmail = proposalState.contractRepEmail || "________________________";

  const recurrenciaPreco = totals.totalMonthly > 0 ? formatCurrency(totals.totalMonthly) : "R$ 0,00";
  const recurrenciaDia = proposalState.contractDueDayRec || "5";
  const recurrenciaMetodo = proposalState.contractPaymentRec || "Boleto bancário";

  const implementacaoPreco = totals.totalOneOffAndSetup > 0 ? formatCurrency(totals.totalOneOffAndSetup) : "R$ 0,00";
  const implementacaoMetodo = proposalState.contractPaymentSetup || "Pix";
  const implementacaoParcelas = proposalState.contractSetupInstallments || "1";

  const projectStartDate = formatDate(proposalState.contractStartDate);


  // Construir HTML dos módulos
  let modulesHTML = "";
  if (activeModules.length === 0) {
    modulesHTML = `<p class="c4" style="color: #b22222; font-weight: bold; text-align: center; margin: 35px 0;">Nenhum serviço selecionado na proposta. Adicione serviços na aba Proposta para preencher o escopo do contrato.</p>`;
  } else {
    activeModules.forEach((mod) => {
      let serviceScopeHTML = "";
      mod.services.forEach(s => {
        const bullets = parseDescriptionToBullets(s.description);
        let bulletsList = "";
        bullets.forEach(b => {
          bulletsList += `<li class="c5" style="margin-bottom: 4px;"><span class="c1">${b}</span></li>`;
        });

        serviceScopeHTML += `
          <div style="page-break-inside: avoid; margin-bottom: 15px;">
            <p class="c4"><span class="c1 c2">Nível de Serviço: </span><span class="c1">${s.levelName}</span></p>
            <p class="c4"><span class="c1 c2">Entregáveis do escopo:</span></p>
            <ul class="c5" style="margin-left: 20px; padding-left: 0; list-style-type: disc; margin-bottom: 12px;">
              ${bulletsList}
            </ul>
          </div>
        `;
      });

      let guidelinesHTML = "";
      mod.guidelines.forEach((g, gIdx) => {
        guidelinesHTML += `<p class="c4"><span class="c1">${gIdx + 1}. ${g}</span></p>`;
      });

      modulesHTML += `
        <div style="margin-bottom: 25px;">
          <h3 class="c9" style="border-bottom: 0.5pt solid #b22222; padding-bottom: 2px; margin-bottom: 8px; page-break-after: avoid;">
            <span class="c36 c1 c2">Módulo: ${mod.name}</span>
          </h3>
          ${serviceScopeHTML}
          <p class="c4" style="page-break-after: avoid;"><span class="c1 c2">Diretrizes Relevantes:</span></p>
          ${guidelinesHTML}
        </div>
      `;
    });
  }


  // Processamento dinâmico das cláusulas para vincular dados da proposta
  const clausesForRender = JSON.parse(JSON.stringify(proposalState.contractClauses || defaultClauses));

  // 1. Substituição do Prazo Contratual na Cláusula 11
  const contractTermText = proposalState.contractTerm || "Aviso prévio de 30 dias";
  const monthsMatch = contractTermText.match(/(\d+)\s*mes/i);
  const daysMatch = contractTermText.match(/(\d+)\s*dia/i);

  if (clausesForRender.clause11) {
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1]);
      const monthsWords = numberToPortugueseWords(months);
      
      const newParagraph11_1 = `<p class="c4"><span class="c1 c6">11.1. O presente contrato ter&aacute; prazo de vig&ecirc;ncia determinado de ${months} (${monthsWords}) meses. Caso o CONTRATANTE opte pela rescis&atilde;o antecipada deste instrumento antes do t&eacute;rmino do prazo estipulado, ficar&aacute; obrigado a pagar &agrave; CONTRATADA multa contratual equivalente ao valor total das parcelas mensais restantes para o t&eacute;rmino do prazo contratado.</span></p>`;
      
      const newParagrafoUnico = `<p class="c4"><span class="c20 c1 c2 c6">Par&aacute;grafo &uacute;nico. </span><span class="c1 c6">Ap&oacute;s o t&eacute;rmino do prazo determinado de ${months} (${monthsWords}) meses, o contrato vigorar&aacute; por prazo indeterminado, podendo ser cancelado por qualquer das partes mediante aviso pr&eacute;vio de 30 (trinta) dias.</span></p>`;

      clausesForRender.clause11 = clausesForRender.clause11
        .replace(/<p[^>]*><span[^>]*>11\.1\..*?<\/p>/gi, newParagraph11_1)
        .replace(/<p[^>]*><span[^>]*>Par&aacute;grafo &uacute;nico\..*?<\/p>/gi, newParagrafoUnico);
    } else {
      const days = daysMatch ? parseInt(daysMatch[1]) : 30;
      const daysWords = numberToPortugueseWords(days);

      const newParagraph11_1 = `<p class="c4"><span class="c1 c6">11.1. O CONTRATANTE poder&aacute; operar o cancelamento da assinatura, a qualquer tempo, mediante comunica&ccedil;&atilde;o por escrito, via endere&ccedil;o eletr&ocirc;nico (e-mail), &agrave; CONTRATADA. O CONTRATANTE dever&aacute; respeitar o aviso pr&eacute;vio de ${days} (${daysWords}) dias, no qual ter&aacute; a continuidade da presta&ccedil;&atilde;o de servi&ccedil;os e dever&aacute; realizar os devidos pagamentos mensais pelo prazo do aviso.</span></p>`;
      
      const newParagrafoUnico = `<p class="c4"><span class="c20 c1 c2 c6">Par&aacute;grafo &uacute;nico. </span><span class="c1 c6">No caso de descumprimento dos prazos acima estabelecidos pelo CONTRATANTE, o valor correspondente ao aviso pr&eacute;vio devido dever&aacute; ser adimplido em car&aacute;ter indenizat&oacute;rio &agrave; CONTRATADA, sem presta&ccedil;&atilde;o de servi&ccedil;os equivalente.</span></p>`;

      clausesForRender.clause11 = clausesForRender.clause11
        .replace(/<p[^>]*><span[^>]*>11\.1\..*?<\/p>/gi, newParagraph11_1)
        .replace(/<p[^>]*><span[^>]*>Par&aacute;grafo &uacute;nico\..*?<\/p>/gi, newParagrafoUnico);
    }
  }

  // 2. Substituição do Primeiro Pagamento (Regra D+X) na Cláusula 3
  const paymentTermsText = proposalState.paymentTerms || "";
  const dMatch = paymentTermsText.match(/D\+(\d+)/i);
  const firstPaymentDays = dMatch ? parseInt(dMatch[1]) : 7;
  const firstPaymentDaysWords = numberToPortugueseWords(firstPaymentDays);

  if (clausesForRender.clause3) {
    clausesForRender.clause3 = clausesForRender.clause3
      .replace(/Prazo D\+7/gi, `Prazo D+${firstPaymentDays}`)
      .replace(/at&eacute; 7 \(sete\) dias/gi, `at&eacute; ${firstPaymentDays} (${firstPaymentDaysWords}) dias`)
      .replace(/at&eacute; \d+ \(.*\) dias/gi, `at&eacute; ${firstPaymentDays} (${firstPaymentDaysWords}) dias`)
      .replace(/at&eacute; \d+ dias/gi, `at&eacute; ${firstPaymentDays} (${firstPaymentDaysWords}) dias`);

    if (hasRecurrencia && !hasImplementacao) {
      clausesForRender.clause3 = clausesForRender.clause3
        .replace(/implementa&ccedil;&atilde;o e execu&ccedil;&atilde;o/g, "execu&ccedil;&atilde;o")
        .replace(/ e ao valor da implementa&ccedil;&atilde;o pontual \(ou &agrave; sua primeira parcela, caso tenha sido parcelada\)/g, "");
    } else if (!hasRecurrencia && hasImplementacao) {
      clausesForRender.clause3 = clausesForRender.clause3
        .replace(/implementa&ccedil;&atilde;o e execu&ccedil;&atilde;o/g, "implementa&ccedil;&atilde;o")
        .replace(/fee mensal e ao /g, "");
    } else if (!hasRecurrencia && !hasImplementacao) {
      clausesForRender.clause3 = clausesForRender.clause3
        .replace(/o valor de implementa&ccedil;&atilde;o e execu&ccedil;&atilde;o da Byline/g, "os valores acordados da Byline")
        .replace(/, correspondente ao fee mensal e ao valor da implementa&ccedil;&atilde;o pontual \(ou &agrave; sua primeira parcela, caso tenha sido parcelada\),/g, "");
    }
  }

  container.innerHTML = getContractTemplateHTML({
    contractCompany,
    contractCNPJ,
    contractPhone,
    contractAddress,
    contractRepName,
    contractRepEmail,
    recurrenciaPreco,
    recurrenciaDia,
    recurrenciaMetodo,
    implementacaoPreco,
    implementacaoMetodo,
    implementacaoParcelas,
    projectStartDate,
    modulesHTML,
    clauses: clausesForRender,
    hasImplementacao,
    hasRecurrencia
  });
}

function printContract() {
  updateContractPreview();
  const originalTitle = document.title;
  const clientName = proposalState.clientName || proposalState.contractCompany || "Cliente";
  document.title = `Contrato de Prestação de Serviços ${clientName}`;
  document.body.classList.add("print-contract-mode");
  window.print();
  setTimeout(() => {
    document.body.classList.remove("print-contract-mode");
    document.title = originalTitle;
  }, 1000);
}

// Helpers para renderização de Bônus e design responsivo
function getBonusBadgeHTML() {
  return `<span class="service-preview-level badge-bonus">BÔNUS</span>`;
}

function getBonusPriceTextHTML(price, isRecurring = false) {
  const strikethroughClass = isRecurring ? "price-strikethrough-recurring" : "price-strikethrough";
  const badgeClass = isRecurring ? "badge-bonus-child" : "badge-bonus-inline";
  return `<span class="${strikethroughClass}">${formatCurrency(price)}</span><span class="${badgeClass}">BÔNUS</span>`;
}

function getBonusServiceNameHTML(name, isBonus, customSize = "10px") {
  if (isBonus) {
    return `${name} <span class="service-bonus-name" style="font-size: ${customSize};">(Bônus)</span>`;
  }
  return name;
}

