// Banco de Dados de Serviços Rakta
export const servicesData = {
  performance: {
    title: "Performance & Growth",
    services: [
      {
        id: "midia_paga",
        name: "Gestão de Mídia Paga",
        platforms: "Meta + Google + TikTok + LinkedIn",
        levels: {
          entrada: {
            name: "Nível Entrada",
            price: 990,
            period: "mês",
            description: "Inclui a gestão de 2 plataformas (Meta e Google)\nlimite de até R$ 3k de verba\n1 campanha ativa\nrelatório mensal básico\notimização semanal."
          },
          intermediario: {
            name: "Nível Intermediário",
            price: 2500,
            period: "mês",
            description: "Inclui 3 plataformas\nlimite de até R$ 10k de verba\nde 3 a 5 campanhas\nrelatório quinzenal\notimização semanal\ncriativos básicos."
          },
          avancado: {
            name: "Nível Avançado",
            price: 5000,
            priceRange: [4000, 6000],
            period: "mês",
            description: "Inclui 4 plataformas\nverba ilimitada\ncampanhas múltiplas\nrelatório semanal\notimização diária\ntestes A/B\nestratégias de remarketing avançado."
          }
        }
      },
      {
        id: "seo_conteudo",
        name: "SEO & Conteúdo Orgânico com IA",
        levels: {
          entrada: {
            name: "Nível Entrada",
            price: 990,
            period: "mês",
            description: "Oferece uma auditoria técnica inicial (realizada uma única vez)\n1 conteúdo otimizado por mês\nmonitoramento de 10 palavras-chave\nrelatório mensal de posições."
          },
          intermediario: {
            name: "Nível Intermediário",
            price: 2500,
            period: "mês",
            description: "Entrega SEO técnico contínuo\n3 conteúdos por mês\nestratégias de link building básico\nmonitoramento de 30 palavras-chave\notimização voltada para AEO (buscas por Inteligência Artificial)."
          },
          avancado: {
            name: "Nível Avançado",
            price: 5000,
            priceRange: [4000, 6000],
            period: "mês",
            description: "Contempla SEO técnico combinado com ações on-page e off-page\nmais de 6 conteúdos por mês\nlink building ativo\nmonitoramento de mais de 50 palavras-chave\nestratégias de AEO/GEO\ncriação de topic clusters."
          }
        }
      },
      {
        id: "assessoria_growth",
        name: "Assessoria de Growth / Consultoria",
        levels: {
          entrada: {
            name: "Nível Entrada",
            price: 490,
            period: "mês",
            description: "Focado apenas em direcionamento: disponibiliza 1 reunião estratégica por mês (com duração de 1 hora)\nrelatório de diagnóstico mensal\nrecomendações por escrito\nsem envolver execução ativa."
          },
          intermediario: {
            name: "Nível Intermediário",
            price: 1500,
            period: "mês",
            description: "Garante 2 reuniões por mês\nanálise de funil\ndefinição de KPIs\nacompanhamento próximo de métricas\ndirecionamento tático."
          },
          avancado: {
            name: "Nível Avançado",
            price: 3500,
            priceRange: [3000, 4000],
            period: "mês",
            description: "Composto por reuniões semanais\nestabelecimento e acompanhamento de OKRs\nplanejamento trimestral detalhado\nanálise competitiva de mercado\nparticipação direta no comitê de marketing do cliente."
          }
        }
      },
      {
        id: "bi_dashboards",
        name: "Gestão e Visualização de Dados (BI)",
        levels: {
          entrada: {
            name: "Nível Entrada",
            price: 690,
            period: "mês",
            description: "Construção de 1 dashboard (utilizando Looker Studio ou Power BI)\nconexão de até 3 fontes de dados\natualização manual feita mensalmente\nrelatório interpretativo mensal."
          },
          intermediario: {
            name: "Nível Intermediário",
            price: 1500,
            period: "mês",
            description: "Desenvolvimento de 2 a 3 dashboards\nconexão de até 6 fontes de dados\nsistema de atualização automatizada\nrelatórios quinzenais munidos de insights práticos."
          },
          avancado: {
            name: "Nível Avançado",
            price: 2750,
            priceRange: [2500, 3000],
            period: "mês",
            description: "Dashboards e fontes de dados ilimitados\nautomação de ponta a ponta\nanálises preditivas\nconfiguração de alertas automáticos\nreunião semanal focada em dados."
          }
        }
      },
      {
        id: "google_meu_negocio",
        name: "Estruturação e Otimização do Google Meu Negócio",
        levels: {
          entrada: {
            name: "Nível Entrada",
            price: 490,
            period: "mês",
            description: "Auditoria Geográfica básica com configuração de endereço e mapa de acesso e categorias exatas da empresa\nEngenharia de Avaliações para coleta de feedbacks pós-atendimento para otimizar o posicionamento\nVitrine Digital Local inicial com fotos profissionais da fachada para gerar confiança imediata\nRelatório mensal de acessos e cliques no perfil."
          },
          intermediario: {
            name: "Nível Intermediário",
            price: 990,
            period: "mês",
            description: "Auditoria Geográfica completa com otimização cirúrgica do mapa e horários e contatos\nEngenharia de Avaliações estratégica com fluxo ativo e link direto de avaliações para elevar o ranqueamento orgânico\nVitrine Digital Local com postagens quinzenais e fotos profissionais atualizadas\nOtimização contínua de palavras-chave para busca local\nRelatório quinzenal com acompanhamento de concorrentes."
          },
          avancado: {
            name: "Nível Avançado",
            price: 1490,
            period: "mês",
            description: "Auditoria Geográfica avançada com otimização contínua de categorias para múltiplas unidades\nEngenharia de Avaliações automatizada pós-consulta para hospital ou clínicas e coleta de prova social\nVitrine Digital Local premium com sessões de fotos mensais e postagens semanais de novidades\nOtimização avançada de termos de busca e integração com Google Local Ads\nRelatório semanal detalhado com reuniões estratégicas de alinhamento."
          }
        }
      }
    ]
  },
  branding: {
    title: "Branding & Criação",
    services: [
      {
        id: "social_media",
        name: "Social Media (Gestão Redes)",
        levels: {
          entrada: {
            name: "Nível Entrada",
            price: 990,
            period: "mês",
            description: "Gerenciamento de 1 a 2 redes sociais\nprodução de 8 posts por mês\nplanejamento editorial básico\ndesign das peças\nagendamento de posts\nenvio de relatório mensal."
          },
          intermediario: {
            name: "Nível Intermediário",
            price: 2000,
            period: "mês",
            description: "Gerenciamento de 2 a 3 redes\n12 posts por mês\nprodução de 8 stories por mês\nredação de copy combinada ao design\nrelatório quinzenal\nplanejamento editorial intermediário."
          },
          avancado: {
            name: "Nível Avançado",
            price: 3500,
            priceRange: [3000, 4000],
            period: "mês",
            description: "Cobertura de 3 a 4 redes\nmais de 20 posts por mês\npublicação diária de stories\nprodução de 4 reels ou vídeos por mês\nserviço de SAC social\ngestão activa de comunidade\nrelatórios semanais."
          }
        }
      },
      {
        id: "criativos_anuncios",
        name: "Criativos para Anúncios (Estáticos + Vídeo)",
        levels: {
          entrada: {
            name: "Nível Entrada",
            price: 990,
            period: "mês",
            description: "Entrega de 4 peças estáticas por mês\ndesdobramento em 2 adaptações de formato\n1 rodada de revisão por peça."
          },
          intermediario: {
            name: "Nível Intermediário",
            price: 1250,
            period: "mês",
            description: "Entrega de 6 a 8 peças estáticas por mês\ndesdobramento em múltiplos formatos\n2 rodadas de revisão."
          },
          avancado: {
            name: "Nível Avançado",
            price: 1750,
            priceRange: [1500, 2000],
            period: "mês",
            description: "Produção de 10 a 14 peças estáticas somadas a 2 vídeos curtos\ndesdobramento em múltiplos formatos\n2 rodadas de revisão\ntestes de criativo\naplicação de motion graphics básico."
          }
        }
      },
      {
        id: "video_maker",
        name: "Video Maker (Criação de Conteúdo Audiovisual)",
        levels: {
          mensal: {
            name: "Mensal",
            price: 1500,
            period: "mês",
            description: "2 captações presenciais (até 3h cada)\nEdição de vídeos para Reels/TikTok (até 4 vídeos/mês)\nCuradoria de trilhas e sound design\nBackup de arquivos brutos por 30 dias"
          }
        }
      },
      {
        id: "branding_marca",
        name: "Branding — Criação de Marca",
        levels: {
          essencial: {
            name: "Nível Essencial",
            price: 10000,
            priceRange: [8000, 12000],
            period: "projeto",
            description: "Engloba pesquisa de referências\nlogotipo e suas variações\ndefinição de paleta de cores e tipografia\nmanual de marca básico (de 10 a 15 páginas)\npapelaria essencial (cartão de visitas e assinatura de e-mail)."
          },
          completo: {
            name: "Nível Completo",
            price: 16500,
            priceRange: [13000, 20000],
            period: "projeto",
            description: "Une os escopos do Essencial ao processo de Naming\nestruturação de brand strategy\nmanual completo de marca (mais de 30 páginas)\npapelaria expandida\ntemplates para redes sociais\ndefinição de tom de voz corporativo\nfotografia dirigida."
          }
        }
      },
      {
        id: "rebranding",
        name: "Rebranding",
        levels: {
          parcial: {
            name: "Nível Parcial",
            price: 14000,
            priceRange: [10000, 18000],
            period: "projeto",
            description: "Entrega diagnóstico de marca\natualização da identidade visual existente\ndesenvolvimento de um novo manual\nmigração dos materiais institucionais mais importantes."
          },
          completo: {
            name: "Nível Completo",
            price: 24500,
            priceRange: [19000, 30000],
            period: "projeto",
            description: "Soma os itens do modelo Parcial ao reposicionamento estratégico do negócio\ncriação de uma nova narrativa de marca\nimplementação completa em canais digitais e físicos\nplano guiado de transição de marca."
          }
        }
      }
    ]
  },
  digital: {
    title: "Digital & Web",
    services: [
      {
        id: "site_institucional",
        name: "Site Institucional",
        levels: {
          basico: {
            name: "Nível Básico",
            price: 5500,
            priceRange: [4000, 7000],
            period: "projeto",
            description: "Construção de até 5 páginas utilizando template premium customizado\ndesign responsivo\nSEO on-page básico\nformulários de contato\npainel CMS em WordPress."
          },
          avancado: {
            name: "Nível Avançado",
            price: 10000,
            priceRange: [8000, 12000],
            period: "projeto",
            description: "Desenvolvimento de até 15 páginas com design inteiramente customizado (do zero)\nSEO técnico completo\nblog integrado\nconexões com ferramentas de CRM\nAnalytics avançado configurado\nchatbot em nível básico\ntreinamento da equipe do cliente."
          }
        }
      },
      {
        id: "landing_page",
        name: "Landing Page (LP)",
        levels: {
          simples: {
            name: "Nível Simples",
            price: 1700,
            priceRange: [1400, 2000],
            period: "projeto",
            description: "LP com 1 página\ncontendo copy e design focado em conversão\nformulário integrado\nestrutura responsiva\ninstalação de pixel de rastreamento\ndireito a 1 rodada de revisão."
          },
          avancada: {
            name: "Nível Avançada",
            price: 2600,
            priceRange: [2200, 3000],
            period: "projeto",
            description: "LP com 1 página principal acrescida de uma variação para testes A/B\ncopy altamente persuasivo\ndesign premium personalizado\nintegrações diretas com WhatsApp e CRM\n2 rodadas de revisão\nsetup completo de metas de conversão."
          }
        }
      },
      {
        id: "ecommerce",
        name: "E-commerce (Criação)",
        levels: {
          starter: {
            name: "Nível Starter",
            price: 9000,
            priceRange: [6000, 12000],
            period: "projeto",
            description: "Cadastro de até 50 produtos em plataformas como Shopify ou WooCommerce\nuso de template customizado\nconfiguração de gateway de pagamento principal\ncálculo de frete básico\ntreinamento operacional para o lojista."
          },
          completo: {
            name: "Nível Completo",
            price: 21500,
            priceRange: [13000, 30000],
            period: "projeto",
            description: "Cadastro de produtos ilimitados\nlayout totalmente sob medida\nmúltiplos gateways de pagamento\nintegrações complexas com sistemas de ERP e hubs de logística\nSEO específico para e-commerce\nautomações focadas em recuperação de carrinho abandonado\ngatilhos de upsell ou cross-sell."
          }
        }
      },
      {
        id: "manutencao_recorrente",
        name: "Manutenções Recorrentes",
        levels: {
          site_lp: {
            name: "Foco em Site/LP",
            price: 945,
            priceRange: [490, 1400],
            period: "mês",
            description: "Rotinas de segurança e backups\nalteração simples de conteúdo\ncriação de novas páginas\notimizações gerais de SEO\nnovas integrações de APIs."
          },
          ecommerce: {
            name: "Foco em E-commerce",
            price: 1995,
            priceRange: [990, 3000],
            period: "mês",
            description: "Gestão de catálogo de produtos\nsuporte operacional comercial\nsuporte a campanhas sazonais\nintegrações sistêmicas\notimizações contínuas de conversão (CRO)."
          }
        }
      }
    ]
  },
  tecnologia: {
    title: "Tecnologia & Automação",
    services: [
      {
        id: "chatbot_ia",
        name: "Chatbot com IA (WhatsApp/Web)",
        levels: {
          basico: {
            name: "Nível Básico",
            price: 5500,
            priceRange: [3000, 8000],
            period: "setup",
            description: "Criação de robô estruturado em regras lógicas combinadas com uma camada de IA básica\nmapeamento de até 20 intenções do usuário\nativação em 1 canal único (WhatsApp ou Web)\nresposta automática de FAQs.",
            recurring: 490
          },
          avancado: {
            name: "Nível Avançado",
            price: 14500,
            priceRange: [9000, 20000],
            period: "setup",
            description: "Implementação de IA conversacional robusta com Processamento de Linguagem Natural (NLP)\nintenções ilimitadas de diálogos\narquitetura multi-canal\nintegrações nativas com CRM e ERP\nqualificação inteligente de leads.",
            recurring: 2000,
            recurringRange: [1500, 2500]
          }
        }
      },
      {
        id: "agentes_ia",
        name: "Agentes de IA / Automação",
        levels: {
          basico: {
            name: "Nível Básico",
            price: 8500,
            priceRange: [5000, 12000],
            period: "projeto",
            description: "Desenvolvimento de 1 agente autônomo com escopo bem delimitado\nprogramado para processar 1 tipo específico de documento\nintegrado a 1 ou 2 sistemas internos\naplicando técnicas de RAG (Retrieval-Augmented Generation) básico sobre uma base fixa de conhecimento."
          },
          avancado: {
            name: "Nível Avançado",
            price: 21500,
            priceRange: [13000, 30000],
            period: "projeto",
            description: "Orquestração de múltiplos agentes de IA trabalhando em conjunto\nprocessamento de dados em múltiplos formatos\nintegrações de alta complexidade\narquitetura RAG avançada\nautomação de fluxos inteiros (workflows)\nrotinas de monitoramento."
          }
        }
      },
      {
        id: "integracao_api",
        name: "Integrações de API (n8n/Make)",
        levels: {
          simples: {
            name: "Nível Simples",
            price: 4500,
            priceRange: [3000, 6000],
            period: "projeto",
            description: "Conexão técnica de até 3 sistemas distintos\nestruturação de 2 a 3 fluxos automatizados de dados\nentrega de documentação operacional básica\n1 rodada inclusa de ajustes finos."
          },
          complexo: {
            name: "Nível Complexo",
            price: 11000,
            priceRange: [7000, 15000],
            period: "projeto",
            description: "Conexão de mais de 5 sistemas simultâneos\nfluxos de automação ilimitados\ndesenvolvimento de lógicas condicionais complexas\nrotinas avançadas para tratamento de erros\nfornecimento de documentação completa\ntreinamento de equipe."
          }
        }
      },
      {
        id: "app_mobile",
        name: "Desenvolvimento de App Mobile",
        levels: {
          mvp: {
            name: "Nível MVP",
            price: 32500,
            priceRange: [20000, 45000],
            period: "projeto",
            description: "Construção de um produto mínimo viável contendo até 8 telas\nfocado em apenas 1 plataforma de escolha (Android ou iOS via Flutter/React Native)\nautenticação\nCRUD básico\npublicação."
          },
          completo: {
            name: "Nível Completo",
            price: 75000,
            priceRange: [50000, 100000],
            period: "projeto",
            description: "Aplicativo robusto contendo mais de 15 telas\ncompatibilidade nativa com ambas as plataformas (iOS e Android)\nintegrações complexas (meios de pagamento, push, geolocalização)\npainel administrativo web\nUX/UI personalizado\ntestes completos\nsuporte dedidado."
          }
        }
      },
      {
        id: "plataforma_web",
        name: "Plataforma Web / SaaS sob Medida",
        levels: {
          medio: {
            name: "Médio Porte",
            price: 45000,
            priceRange: [30000, 60000],
            period: "projeto",
            description: "Desenvolvimento de sistemas com até 10 módulos funcionais\npainel de administração geral\ngestão de níveis de usuários\nintegração direta com 2 ou 3 APIs externas\ninterface responsiva\nentrega de documentação."
          },
          grande: {
            name: "Grande Porte",
            price: 82500,
            priceRange: [65000, 100000],
            period: "projeto",
            description: "Módulos funcionais ilimitados\ninfraestrutura multi-tenant\nmotor de cobrança (billing) integrado\ndesenvolvimento de API própria\nhospedagem estruturada em nuvem\nCI/CD\nmonitoramento e SLA."
          }
        }
      },
      {
        id: "nocode_lowcode",
        name: "Soluções No-code / Low-code",
        levels: {
          basico: {
            name: "Nível Básico",
            price: 2600,
            priceRange: [1200, 4000],
            period: "projeto",
            description: "Construção rápida de MVPs utilizando ecossistemas como Bubble\nFlutterFlow ou Glide\nenglobando até 5 telas de navegação\noperações básicas de banco de dados (CRUD)\n1 integração\npublicação."
          },
          avancado: {
            name: "Nível Avançado",
            price: 8500,
            priceRange: [5000, 12000],
            period: "projeto",
            description: "Aplicativo completo composto por mais de 10 telas\nlógica de dados avançada\nmúltiplos sistemas integrados\ncontrole de autenticação e permissões\ndesign personalizado\ntreinamento da equipe."
          }
        }
      }
    ]
  },
  crm: {
    title: "CRM & Relacionamento",
    services: [
      {
        id: "gestao_crm",
        name: "Manutenção e Gestão de CRM",
        levels: {
          entrada: {
            name: "Nível Entrada",
            price: 590,
            period: "mês",
            description: "Setup técnico inicial de 1 funil de vendas (pipeline)\nconfiguração básica de campos de dados\ncriação de 1 automação interna simples\ncanal de suporte focado via e-mail\nenvio de relatório de performance mensal."
          },
          intermediario: {
            name: "Nível Intermediário",
            price: 1200,
            period: "mês",
            description: "Gestão activa de 2 a 3 funis comerciais\nprogramação de réguas e automações de follow-up de vendas\nintegração de dados com 1 canal de comunicação (WhatsApp ou e-mail)\nrelatório quinzenal."
          },
          avancado: {
            name: "Nível Avançado",
            price: 1900,
            priceRange: [1800, 2000],
            period: "mês",
            description: "Funis e pipelines ilimitados\nautomações complexas de ponta a ponta\ncomunicação multicanal integrada\ninteligência de pontuação de contatos (lead scoring)\nrelatórios customizados\nreuniões mensais."
          }
        }
      },
      {
        id: "jornada_relacionamento",
        name: "Jornadas de Relacionamento",
        levels: {
          basico: {
            name: "Nível Básico",
            price: 990,
            period: "setup",
            description: "Estruturação de 1 jornada de contatos contendo até 5 etapas em apenas 1 canal de comunicação\nuso de templates em formato básico\nmonitoramento simplificado da taxa de abertura.",
            recurring: 490
          },
          avancado: {
            name: "Nível Avançado",
            price: 2500,
            period: "setup",
            description: "Desenvolvimento de múltiplas jornadas simultâneas (nutrição, onboarding, reativação, recuperação de carrinho)\nabordagem multicanal coordenada\nsegmentações\ntestes A/B\nrelatórios robustos.",
            recurring: 2250,
            recurringRange: [1500, 3000]
          }
        }
      }
    ]
  },
  consultoria: {
    title: "Consultoria & Estratégia",
    services: [
      {
        id: "consultoria_ia",
        name: "Consultoria de IA (Marketing)",
        levels: {
          diagnostico: {
            name: "Modelo Diagnóstico",
            price: 4000,
            priceRange: [3000, 5000],
            period: "projeto",
            description: "Mapeamento consultivo focado em oportunidades de IA no negócio\nbenchmarking de ferramentas\nentrega de relatório de roadmap\n1 reunião para apresentação estratégica."
          },
          implementacao: {
            name: "Modelo Implementação",
            price: 7500,
            priceRange: [5000, 10000],
            period: "mês",
            description: "Soma o diagnóstico à execução e implantação das ferramentas sugeridas\ntreinamento da equipe interna\nacompanhamento gerencial mensal\notimização de processos\nauditoria de métricas de adoção."
          }
        }
      },
      {
        id: "transformacao_digital",
        name: "Consultoria Transf. Digital",
        levels: {
          sprint: {
            name: "Modelo Sprint",
            price: 7500,
            priceRange: [5000, 10000],
            period: "projeto",
            description: "Mapeamento detalhado de até 5 processos internos\ndiagnóstico completo de maturidade digital\nentrega de roteiro tecnológico para os próximos 6 meses\npriorização de iniciativas."
          },
          completo: {
            name: "Modelo Completo",
            price: 16000,
            priceRange: [12000, 20000],
            period: "projeto",
            description: "Mapeamento irrestrito de processos\nblueprint tecnológico completo\nroadmap de 12 meses\nbusiness case financeiro para as iniciativas\nacompanhamento prático da implementação por 3 meses."
          }
        }
      },
      {
        id: "hora_avulsa",
        name: "Hora Consultiva Avulsa",
        levels: {
          senhor: {
            name: "Consultor Sênior",
            price: 425,
            priceRange: [250, 600],
            period: "hora",
            description: "Sessões dinâmicas de estratégia comercial\nmentorias personalizadas\ndiagnósticos rápidos ou pareceres técnicos sobre projetos. Mínimo de 1h por sessão. Relatório por escrito (+ R$ 200 opcional)."
          }
        }
      }
    ]
  }
};

// Modelos de Personalização por Nicho
export const nicheTemplates = {
  ecommerce: {
    name: "E-commerce & Varejo Digital",
    painPoints: [
      "Abandono crônico de carrinho e baixa conversão no checkout.",
      "Custo de Aquisição (CAC) crescente corroendo a margem dos produtos.",
      "Baixo índice de recompra (LTV) e falta de retenção da base."
    ],
    strategy: "Nossa estratégia para o seu E-commerce está focada em maximizar o Retorno sobre Investimento Publicitário (ROAS). Implementaremos campanhas avançadas de Mídia Performance aliadas a automações de recuperação de checkout, e-mail marketing comportamental e otimização de conversão (CRO) nas páginas de produto. Focaremos no aumento da taxa de conversão e na frequência de compra para expandir seu faturamento de forma sustentável."
  },
  saas: {
    name: "SaaS & Tecnologias B2B",
    painPoints: [
      "Ciclo de vendas longo e dependência de prospecção fria e ineficiente.",
      "Churn (cancelamento) elevado e perda de contas ativas antes do break-even.",
      "Custo por Lead qualificado (MQL) alto e baixa conversão para SQL no funil."
    ],
    strategy: "Para acelerar o crescimento do seu SaaS, desenharemos um mecanismo híbrido de geração de demanda. Combinaremos campanhas focadas em tomadores de decisão (LinkedIn Ads e Google Ads com intenção de compra) a fluxos automatizados de qualificação via chat com IA e réguas de nutrição ricas no HubSpot. Nosso foco é reduzir o Custo de Aquisição de Clientes (CAC) e diminuir o tempo do ciclo de vendas."
  },
  health: {
    name: "Clínicas, Médicos & Saúde/Estética",
    painPoints: [
      "Dificuldade de atrair pacientes qualificados para procedimentos de alto valor.",
      "Dependência extrema do boca-a-boca e instabilidade na agenda mensal.",
      "Falta de um processo automatizado para triagem e agendamento rápido de consultas."
    ],
    strategy: "Criaremos um ecossistema de atração focado em autoridade local e desejo. Posicionaremos seus serviços mais valiosos usando anúncios segmentados por geolocalização e interesse de alto padrão (Meta/Google Ads). Desenvolveremos Landing Pages de alta conversão integradas a um Chatbot IA inteligente que qualifica o lead e direciona para o agendamento no WhatsApp de forma imediata, garantindo a agenda cheia com pacientes premium."
  },
  local: {
    name: "Negócios Locais, Varejo & Franquias",
    painPoints: [
      "Instabilidade no fluxo de clientes físicos nos dias úteis da semana.",
      "Falta de visibilidade nas buscas locais do Google (Google Meu Negócio).",
      "Processo ineficiente de fidelização de clientes que compram apenas uma vez."
    ],
    strategy: "Nossa proposta para seu negócio local visa inundar seus canais de atendimento e estabelecimento. Otimizaremos sua presença orgânica no Google (Local SEO) e criaremos campanhas de tráfego de proximidade geográfica no Instagram/Facebook com ofertas irresistíveis. Adicionalmente, estruturaremos uma automação de relacionamento pós-visita para garantir o retorno constante e a recorrência de compra dos clientes."
  },
  realestate: {
    name: "Imobiliário, Corretores & Construtoras",
    painPoints: [
      "Investimento em leads frios e desqualificados que sobrecarregam o time de vendas.",
      "Falta de agilidade no primeiro contato com o lead interessado em um imóvel.",
      "Alto Custo por Lead (CPL) em lançamentos imobiliários sem diferenciação competitiva."
    ],
    strategy: "A estratégia imobiliária consiste em blindar o tempo dos seus corretores com leads pré-qualificados. Desenvolveremos campanhas segmentadas com materiais ricos de empreendimentos específicos. Todos os cadastros serão processados em segundos por um Agente de IA integrado ao CRM (Kommo/HubSpot), que fará a primeira triagem de perfil e renda via chat e agendará visitas presenciais apenas com clientes aptos para compra."
  },
  infoproducts: {
    name: "Infoprodutos & Educação Online",
    painPoints: [
      "Escassez de leads qualificados para lançamentos ou modelo perpétuo.",
      "Custos por lead (CPL) instáveis que inviabilizam o ROAS nas janelas de venda.",
      "Baixo engajamento nas etapas de aquecimento e recuperação de vendas inativas."
    ],
    strategy: "Focaremos na criação de um funil perpétuo de alta performance e escala. Estruturaremos campanhas de aquisição de tráfego ultra-segmentadas com testes contínuos de criativos baseados em gatilhos mentais fortes. Desenvolveremos jornadas completas de e-mail e WhatsApp automatizadas para aquecer os leads, recuperar carrinhos abandonados, fazer ofertas de upsell e aumentar o ticket médio por cliente."
  }
};
