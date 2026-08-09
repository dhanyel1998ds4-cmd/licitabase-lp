(function () {
  const plans = [
    {
      id: 'essential',
      name: 'Essencial',
      icon: 'search',
      tagline: 'Encontre e analise oportunidades',
      audience: 'Para empresas que desejam estruturar a busca e o monitoramento de licitações.',
      prices: {
        monthly: { value: 99, total: '' },
        annual: { value: 79, total: 'Cobrado anualmente: R$\u00A0948' },
      },
      features: [
        { icon: 'radar', label: 'Busca ilimitada de licitações' },
        { icon: 'bell', label: 'Alertas ilimitados' },
        { icon: 'chart', label: 'Comparação de preços com o mercado' },
        { icon: 'target', label: 'Oportunidades com alto potencial' },
        { icon: 'ai', label: 'Alicitante (IA): 5 consultas/dia' },
      ],
      action: { label: 'Escolher Essencial', href: '#trial' },
    },
    {
      id: 'professional',
      name: 'Profissional',
      icon: 'growth',
      tagline: 'Centralize participações e automatize disputas',
      audience: 'Para empresas que já participam com frequência e precisam ganhar eficiência operacional.',
      featured: true,
      badge: 'Mais escolhido',
      prices: {
        monthly: { value: 299, total: '' },
        annual: { value: 199, total: 'Cobrado anualmente: R$\u00A02.388' },
      },
      features: [
        { icon: 'layers', label: 'Tudo do plano Essencial' },
        { icon: 'network', label: 'Integração multi-plataforma' },
        { icon: 'workflow', label: 'Monitoramento de etapas' },
        { icon: 'gavel', label: 'Bot de lances: 1 utilização/semana' },
        { icon: 'brain', label: 'Inteligência de concorrentes' },
        { icon: 'scan', label: 'Raio-X: 2 análises/semana' },
        { icon: 'users', label: 'Acesso para até 2 membros' },
      ],
      action: { label: 'Escolher Profissional', href: '#trial' },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: 'building',
      tagline: 'Automação para operações em escala',
      audience: 'Para empresas com alto volume, múltiplos CNPJs ou equipes maiores.',
      prices: {
        monthly: { value: 997, total: '' },
        annual: { value: 747, total: 'Cobrado anualmente: R$\u00A08.964' },
      },
      features: [
        { icon: 'layers', label: 'Tudo do plano Profissional' },
        { icon: 'infinity', label: 'Bot de lances sem limite semanal' },
        { icon: 'scan', label: 'Raio-X: até 10 análises/semana' },
        { icon: 'document', label: 'Cadastro automático de propostas' },
        { icon: 'sitemap', label: 'Gestão de múltiplos CNPJs' },
        { icon: 'users', label: 'Acesso para até 5 membros' },
        { icon: 'headset', label: 'Atendimento dedicado com SLA' },
      ],
      action: { label: 'Falar com o time', href: '#footer' },
    },
  ];

  const comparison = [
    {
      id: 'search',
      title: 'Busca e monitoramento',
      description: 'Encontre e acompanhe oportunidades',
      icon: 'target',
      rows: [
        { label: 'Busca ilimitada de licitações', values: [true, true, true] },
        { label: 'Alertas ilimitados', values: [true, true, true] },
        { label: 'Comparação de preços com o mercado', values: [true, true, true] },
        { label: 'Oportunidades com alto potencial', values: [true, true, true] },
        { label: 'Alicitante (IA): consultas/dia', values: ['5 consultas/dia', '20 consultas/dia', '50 consultas/dia'] },
      ],
    },
    {
      id: 'integrations',
      title: 'Integrações e participação',
      description: 'Centralize participações em plataformas',
      icon: 'plug',
      rows: [
        { label: 'Integração multi-plataforma', values: [false, true, true] },
        { label: 'Monitoramento de etapas', values: [false, true, true] },
        { label: 'Acesso a portais exclusivos', values: [false, true, true] },
      ],
    },
    {
      id: 'automation',
      title: 'Automação e produtividade',
      description: 'Automatize tarefas e ganhe escala',
      icon: 'spark',
      rows: [
        { label: 'Bot de lances', values: [false, '1 utilização/semana', 'Ilimitado'] },
        { label: 'Cadastro automático de propostas', values: [false, false, true] },
        { label: 'Gestão de múltiplos CNPJs', values: [false, false, true] },
        { label: 'Automação de documentos', values: [false, false, true] },
      ],
    },
    {
      id: 'intelligence',
      title: 'Inteligência e análises',
      description: 'Decida estrategicamente antes de participar',
      icon: 'scan',
      rows: [
        { label: 'Inteligência de concorrentes', values: [false, true, true] },
        { label: 'Raio-X de editais', values: [false, '2 análises/semana', '10 análises/semana'] },
        { label: 'Relatórios avançados', values: [false, true, true] },
        { label: 'Análise de mercado histórica', values: [false, true, true] },
      ],
    },
    {
      id: 'team',
      title: 'Equipe e gestão',
      description: 'Controle toda a sua equipe de licitação',
      icon: 'users',
      rows: [
        { label: 'Membros da equipe', values: ['1 usuário', '2 usuários', '5 usuários'] },
        { label: 'Gestão de carteiras', values: [false, true, true] },
        { label: 'Log de atividades', values: [false, true, true] },
      ],
    },
    {
      id: 'support',
      title: 'Suporte e atendimento',
      description: 'Acompanhamento para sua operação',
      icon: 'headset',
      rows: [
        { label: 'Suporte via e-mail', values: [true, true, true] },
        { label: 'Suporte via WhatsApp', values: [false, true, true] },
        { label: 'Gerente de conta dedicado', values: [false, false, true] },
        { label: 'SLA de atendimento', values: [false, false, '4 horas'] },
      ],
    },
  ];

  window.LICITABASE_PRICING = Object.freeze({ plans, comparison });
})();
