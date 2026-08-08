# Relatório forense de motion — SaaPilot

Referência principal: <https://saapilot.framer.website/>  
Vídeo obrigatório: `Saapilot – AI SaaS & Tech Startup Framer Template - Google Chrome 2026-08-06 16-59-49.mp4`  
Data da análise: 2026-08-06  
Escopo: análise e especificação; nenhuma implementação da página foi feita nesta etapa.

## 1. Resumo executivo de motion

Foram catalogados **20 comportamentos temporais**. Os 20 foram verificados na URL e/ou no código público; 10 também aparecem diretamente no vídeo. Nenhum valor crítico abaixo depende apenas de inferência visual. Os parâmetros exatos de spring, thresholds, timers, breakpoints e Lenis vieram do código público e foram confirmados no navegador. O vídeo foi usado obrigatoriamente para validar ordem, direção, reentrada, sticky, autoplay, pausas e percepção em uma sessão real.

O sistema combina:

- Framer/React com Motion (Framer Motion), WAAPI e layout projection;
- Lenis 1.1.2 para interpolação da roda, com duração de 600 ms;
- entradas `once` por IntersectionObserver/viewport;
- texto do About continuamente ligado ao scroll;
- workflow com `position: sticky` e três estados discretos reversíveis;
- loops de marquee e depoimentos;
- springs próprios para FAQ, menus, botões, cards do workflow e carrossel.

Principais conclusões:

- O vídeo foi gravado em **zoom de navegador de 75%**. A área física da página é 1920×972 px, mas a viewport CSS efetiva é aproximadamente **2560×1296 px**. Medir diretamente os pixels do vídeo como CSS produziria erro de 25%.
- O workflow não é scroll horizontal, parallax nem scrub contínuo. É um palco sticky nativo; três observers com threshold de 50% alternam cards entre `translateY(500px)` e `0` usando spring.
- As entradas comuns executam uma vez e ficam preservadas. Ao voltar a página, não reaparecem nem saem. As exceções reversíveis são o texto do About e os estados do workflow.
- Não há hover genérico de elevação, tilt ou glow nos cards. Não deve ser inventado.
- O site de referência não respeita `prefers-reduced-motion`; a implementação deve corrigir isso conforme a seção 16.

Confiança: **95–100%** para valores provenientes do código/DOM; **80–94%** para associação de eventos ao vídeo. Medidas temporais derivadas de frames têm tolerância de ±34 ms (um frame a ~30 fps) ou ±100–300 ms quando o início depende da posição interpolada do scroll.

## 2. Metadados do vídeo

| Campo | Resultado |
| --- | --- |
| Arquivo | `F:/VIDEOS PC PASTA/Captures/Saapilot – AI SaaS & Tech Startup Framer Template - Google Chrome 2026-08-06 16-59-49.mp4` |
| Tamanho | 76.924.544 bytes |
| Contêiner/duração | 55.303,4 ms |
| Duração efetivamente decodificada | 55.244,733 ms |
| Resolução | 1920×1060 px |
| Codec | H.264 |
| Frame rate real | 29,993809 fps |
| Frames decodificados | 1.657 |
| Áudio | presente; ~80 kbps |
| Browser chrome | presente; 88 px no topo |
| Área física útil da página | 1920×972 px |
| Zoom estimado | 75%, confiança alta |
| Viewport CSS efetiva | ~2560×1296 px |
| Cortes de edição | nenhum jump cut confirmado |

Evidências do zoom: o rail de 1136 CSS px mede ~852 px no vídeo (`1136 × 0,75`), e o polegar móvel da scrollbar mede ~108 px em uma área de 972 px, compatível com viewport CSS de 1296 px sobre uma página de 11835 px. A barra superior de 88 px foi excluída das medições.

A captura contém 662 pares consecutivos de frames exatamente iguais (39,98%) e 230 quase iguais (13,89%), sobretudo durante pausas. Isso é compatível com Game DVR e não foi interpretado como animação. Não foi observada troca de zoom, aba ou viewport durante a gravação.

Artefatos: [metadados completos](motion-analysis/video-metadata.json), [timeline de scrollbar](motion-analysis/video-scroll-timeline.json), [contact sheet geral](motion-analysis/general-contact-sheet.jpg) e [manifesto das sequências críticas](motion-analysis/critical-sequences.json).

## 3. Timeline completa do vídeo

| Intervalo | Scroll CSS aproximado | Direção/velocidade | Seção e evento | Confiança |
| --- | ---: | --- | --- | --- |
| 00:00.000–00:05.368 | 0 | parado | Hero já estável; load reveal ocorreu antes do primeiro frame. Marquee continua. | alta |
| 00:05.368–00:08.100 | 0→~1300 | baixo, moderado | Hero sai por scroll natural; About entra. Começa a revelação contínua de cor do texto. | alta |
| 00:08.100–00:11.200 | ~1300→285 | cima, deliberado | Reversão do texto do About; entradas `once` permanecem visíveis. | alta |
| 00:11.200–00:14.900 | 285→2926 | baixo, rápido | About, métricas e features; reveals por viewport são disparados e travados no estado final. | alta |
| 00:14.900–00:16.700 | ~2926 | parado | Features estáveis; nenhum loop ou hover próprio nos cards. | alta |
| 00:16.700–00:18.200 | ~2926→~3400 | baixo | Entrada no workflow; Step 1/card 1 sobe de 500 para 0. | alta |
| 00:18.200–00:20.300 | ~3400→~4100 | baixo | Step 2; card 2 sobe, linha vai a 67%, marcadores 1–2 ficam ativos. | alta |
| 00:20.300–00:23.300 | ~4100→~5350 | baixo | Step 3; card 3 sobe, linha chega a 100%, três marcadores ativos. | alta |
| 00:23.300–00:24.300 | ~5350 | pausa curta | Estado final do workflow permanece. | alta |
| 00:24.300–00:29.100 | ~5350→3137 | cima | Estados revertem: card 3 desce (~24,6–25,4 s), depois card 2 (~26,6–27,4 s); card 1 continua ativo. | alta |
| 00:29.200–00:33.200 | 3137→6670 | baixo, rápido | Reexecução dos estados 2 e 3 do workflow; segue para benefícios. | alta |
| 00:33.200–00:35.500 | 6670→7588 | baixo com pausa mínima | Benefícios e chegada aos depoimentos. | alta |
| 00:35.600–00:39.700 | ~7588 | parado | Autoplay dos depoimentos troca `Best AI Tool` → `100% Satisfaction` → `Chat Automation` → `Amazing Customer Care`. | alta |
| 00:39.800–00:43.100 | 7588→10018 | baixo | Insights, CTA e FAQ; reveals já executados ficam estáveis. | alta |
| 00:43.200–00:45.300 | ~10018 | parado | FAQ sem clique. Permanecem abertos apenas os dois itens padrão. | alta |
| 00:45.400–00:46.110 | ~10018→10539 | baixo | Footer e fim da página. | alta |
| 00:46.510–00:52.800 | 10539→0 | cima, muito rápido | Retorno completo; pico medido de −2510,24 CSS px/s. Reveals `once` não repetem. Workflow e About respondem ao sentido inverso. | alta |
| 00:52.800–00:55.303 | 0 | parado | Hero novamente estável; marquee continua. | alta |

Primeiro movimento confirmado: 5.367,774 ms, `scrollY≈12,4`. Fundo: 46.109,515 ms, `scrollY=10539`. Maior velocidade para baixo: 1301,61 CSS px/s. A relação tempo/scroll é afetada pela cauda do Lenis; portanto os limites de seção no vídeo têm tolerância de ±0,1–0,3 s.

## 4. Mapa de animações por seção

### Global e header

`T+0`: Lenis assume eventos de roda e interpola o scroll durante 600 ms; toque continua nativo. O header já nasce `fixed`, `top:17px`, altura 51,59 px. Não há variante “scrolled”, redução de altura, hide-on-down ou backdrop blur. A impressão de fundo variável no vídeo vem do conteúdo passando atrás dele.

### Hero

Na hidratação: anúncio/H1 começam em `T+200`; parágrafo em `T+400`; botões/social proof em `T+600`; backdrop/visual em `T+800`; dashboard em `T+1000`. Cada grupo vai de `opacity:.001; y:160px` a `opacity:1; y:0` por spring `200/40/1`, estabilizando em ~1120 ms após seu delay. O vídeo começa depois dessa sequência. Em paralelo, a faixa de logos percorre 2100 px em 84 s, linear.

### What Makes / About

O heading cruza 50% da viewport: `opacity:0; y:95px` → estado final, spring `200/40/1`, uma vez. O texto narrativo usa caracteres: os 27 iniciais ficam brancos; os demais transitam individualmente de `#85868B` para branco conforme o início do bloco cruza de 75% para 15% da viewport. É scrub reversível; a interpolação local de cada caractere tem tween de 300 ms `easeInOut`. Métricas iniciam uma vez com margem de −100 px e usam spring numérico `59/44/1` até 597M+, 249+, 99,57% e 129M+.

### Features / benefícios / insights / CTA

Headings usam `y:95`; itens, cards e blocos usam `y:50` com delays 0/200/400/600/800/1000 ms; ilustrações laterais usam `x:-60`. Todos combinam opacity 0→1, spring e `once:true`. Cards estáveis não ganham transform, glow ou tilt no hover. Backgrounds, grids e glows observados são estáticos.

### Workflow

O palco de 1136×545 CSS px fica sticky em `top:160px`. O primeiro estado é acionado pelo root; os dois seguintes por blocos de 878 px. Ao cruzar 50%, cada estado troca cards de `[500,500,500]` para `[0,500,500]`, `[0,0,500]` e `[0,0,0]`. A linha progride 0→33→67→100% e os marcadores passam de opacity .5 para 1. Transição: spring de 600 ms com bounce .2. `animateOnce:false`; a mudança de direção no vídeo confirma reversão e interrupção naturais.

### Testimonials

Desktop/tablet: cinco variantes em fan, spring `500/60/1`; autoplay a cada 5 s, exceto o quinto estado, que retorna ao primeiro depois de 3 s. Paginação seleciona diretamente qualquer variante. Phone: substitui o fan por ticker horizontal à esquerda, 40 CSS px/s e gap 30 px.

### FAQ e footer

Cada uma das dez linhas alterna independentemente por tap/click. Height/layout e ícone (`rotate:0→45deg`) usam spring `400/40/1`. Exemplo medido: 72→172,78 px; 91,27 px aos 40 ms, 143,83 aos 100 ms, 170,88 aos 200 ms e estável por volta de 400 ms. Dois itens iniciam abertos: “Do I need any technical skills to get started?” e “Is my customer data secure?”. O footer não possui loop próprio confirmado.

## 5. Matriz mestra de animações

| ID | Seção/elemento | Gatilho | Entrada/estado final | Saída ou reversão | Timing | Reexecuta | Fonte | Conf. |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| `global.smooth-scroll` | página | wheel | scroll nativo interpolado | simétrico para cima | 600 ms; Lenis expo-out | contínuo | JS+URL+vídeo | 100% |
| `global.fixed-header` | header | mount/scroll | já fixed, top 17 | nenhuma variante | sem transição | n/a | DOM+vídeo | 100% |
| `hero.load-stagger` | hero | load | op .001/y160 → 1/0 | nenhuma | spring 200/40/1; delays 200–1000 | a cada load | JS+URL | 100% |
| `hero.logo-marquee` | logos | loop | x 0 → −2100 | wrap contínuo | 84 s linear | infinito | JS+URL+vídeo | 100% |
| `about.character-color` | texto | scroll progress | cinza → branco por caractere | reverte com scroll | 300 ms local, easeInOut | contínuo | JS+URL+vídeo | 100% |
| `about.statistics-counter` | métricas | viewport | 0 → valor-alvo | preserva final | spring 59/44/1 | não | JS+URL | 100% |
| `global.section-heading-appear` | headings | 50% viewport | op0/y95 → op1/y0 | sem saída | spring 200/40/1 | não | JS+URL | 100% |
| `global.item-stagger-appear` | cards/blocos | viewport enter | op0/y50 → op1/y0 | sem saída | spring 300/60/1; 0–1000 ms | não | JS+URL+vídeo | 100% |
| `global.side-illustration-appear` | ilustrações | 50% viewport | op0/x−60 → op1/x0 | sem saída | spring 500/80/1 | não | JS+URL | 100% |
| `workflow.desktop-sticky-stage` | palco | scroll | normal → sticky top160 → normal | libera nos dois limites | range ~3996–5800 | contínuo | DOM+vídeo | 100% |
| `workflow.desktop-step-variants` | 3 cards/linha | 50% triggers | y500→0; linha 0→100 | reversível | spring 600 ms, bounce .2 | sim | JS+URL+vídeo | 100% |
| `workflow.tablet-phone-static-stack` | workflow | breakpoint | stack normal | nenhuma | sem animação de passos | n/a | DOM+URL | 100% |
| `testimonials.desktop-autoplay` | depoimentos | timer/click | variante 1→5 | quinto→primeiro | spring 500/60/1; 5 s/3 s | infinito | JS+URL+vídeo | 100% |
| `testimonials.phone-ticker` | depoimentos | loop | translateX à esquerda | wrap contínuo | 40 px/s; gap30 | infinito | JS+URL | 100% |
| `button.primary-secondary-hover` | CTAs | hover | troca cor/fill | reverte em pointerout | spring 400 ms, bounce .2 | sim | JS+URL | 100% |
| `nav.all-pages-dropdown` | dropdown | hover/tap | op0/scale.95 → 1/1 | fecha fora | spring 600/40/.5 | sim | JS+URL | 100% |
| `nav.mobile-expand` | menu phone | tap | painel fechado→aberto | spring distinto ao fechar | 400/35/.6; 400/42/1 | sim | JS+URL | 100% |
| `faq.accordion` | 10 itens | tap/click | height72→auto; +0→45° | fecha independentemente | spring 400/40/1, ~400 ms | sim | JS+URL+vídeo | 100% |
| `form.input-focus` | campo | focus | nenhum motion autoral | nenhum | 0 ms | sim | URL/DOM | 100% |
| `cards.noninteractive` | cards gerais | hover | nenhum transform autoral | nenhum | 0 ms | n/a | URL/DOM | 100% |

## 6. Especificação individual

Os seletores são hints semânticos para a implementação; classes minificadas do Framer não devem ser copiadas. Em springs, os estados intermediários são calculados pelo solver — não substituí-los por keyframes lineares. `S/D/M` significa desktop/tablet/mobile.

### 6.1 `global.smooth-scroll`

- **Identificação:** rota `/`; documento; hint `html.lenis`; função: suavizar a entrada de roda.
- **Evidência:** URL, classe DOM, módulo público Lenis 1.1.2 e caudas da scrollbar no vídeo inteiro; confiança 100%.
- **Gatilho:** wheel, ambas as direções, contínuo; não é scroll-linked de elemento.
- **Estados/keyframes:** posição atual → destino nativo, atualizada por `requestAnimationFrame`; não altera opacity/transform do conteúdo.
- **Timing:** 600 ms; `min(1, 1.001 - 2^(-10*t))`; sem delay/stagger.
- **Scroll:** vertical, `smoothWheel:true`, `syncTouch:false`; CSS `scroll-behavior:auto`; sem pin.
- **S/D/M:** manter em desktop com ponteiro; toque é nativo. **Reduced:** desabilitar Lenis.
- **Implementação/risco:** Lenis ou interpolador equivalente. Não aplicar uma segunda suavização CSS, nem inferir velocidade de animação a partir do deslocamento global.

### 6.2 `global.fixed-header`

- **Identificação:** rota `/`; header; hint `[data-site-header]`; manter navegação disponível.
- **Evidência:** computed style e vídeo; confiança 100%.
- **Gatilho:** mount; scroll não muda variante.
- **Estados/keyframes:** único estado: `position:fixed; top:17px; height:51.59px; backdrop-filter:none`; sem intermediários, saída ou desmontagem.
- **Timing:** 0 ms. **Scroll:** fixed, não sticky; sem threshold.
- **S/D/M:** desktop/tablet usam barra; phone usa variante expansível. **Reduced:** inalterado.
- **Implementação/risco:** CSS fixed. Não criar background-on-scroll, blur, redução de altura ou hide-on-down.

### 6.3 `hero.load-stagger`

- **Identificação:** hero; hints `[data-hero-announcement]`, `h1`, copy, CTAs, social proof e dashboard.
- **Evidência:** variáveis Framer `da` e transições no código, recarga no navegador; não visível no vídeo porque já terminou no frame 0; confiança 100%.
- **Gatilho:** load/mount, uma vez por carregamento; não reverte.
- **Estados:** inicial `opacity:.001; translateY(160px)`; final `opacity:1; translateY(0)`; spring gera os intermediários, sem blur/scale/rotate.
- **Timing:** spring `stiffness:200; damping:40; mass:1`; settle observado ~1120 ms; delays 200/200, 400, 600/600, 800 e 1000 ms; grupos sobrepostos.
- **Scroll:** nenhum. **S/D/M:** mesma lógica, respeitando o layout de cada breakpoint. **Reduced:** todos no final imediatamente.
- **Implementação/risco:** Motion spring. WAAPI reporta `linear` porque o Framer pré-amostra a mola; não usar linear.

### 6.4 `hero.logo-marquee`

- **Identificação:** faixa de logos; hint `[data-logo-marquee] ul`.
- **Evidência:** keyframes públicos, DOM e vídeo 0–5,368/52,8–55,303 s; confiança 100%.
- **Gatilho:** loop automático enquanto visível.
- **Estados:** `translateX(0)` → `translateX(-2100px)`; cópia duplicada fornece wrap sem salto; sem opacity/blur.
- **Timing:** 84000 ms, linear, 25 CSS px/s; infinito; pausa offscreen, não pausa por hover confirmada.
- **S/D/M:** ajustar somente overflow/largura, não a velocidade. **Reduced:** parar em x=0 e mostrar uma linha representativa.
- **Implementação/risco:** CSS keyframes é suficiente; duplicação e largura exata são indispensáveis ao loop contínuo.

### 6.5 `about.character-color`

- **Identificação:** narrativa About; módulo `Text_Opacity_Letters`; hint `[data-about-copy]`.
- **Evidência:** código público + reversão no vídeo 8,1–11,2 s; confiança 100%.
- **Gatilho:** scroll progress contínuo; range `start 0.75` → `start 0.15`; reversível e interrompível.
- **Estados:** primeiros 27 caracteres sempre `#fff`; demais `#85868B` → `#fff`, distribuídos ao longo do progresso. Não há movimento, máscara ou split por linha.
- **Timing:** tween local 300 ms `easeInOut`; sem delay global; o stagger deriva da posição normalizada de cada caractere.
- **Scroll:** linked, scrub suavizado; sem pin. Ao parar, a cor para após a curta interpolação; ao subir, reverte.
- **S/D/M:** recalcular offsets após quebra de linha. **Reduced:** texto todo branco, sem listener de progresso.
- **Implementação/risco:** Motion `useScroll/useTransform` ou cálculo por caractere. Preservar espaços e acessibilidade; evitar que spans fragmentem leitura assistiva.

### 6.6 `about.statistics-counter`

- **Identificação:** quatro métricas; hint `[data-stat]`; alvos 597M+, 249+, 99,57% e 129M+.
- **Evidência:** módulo de contador, props do wrapper e live DOM; confiança 100%.
- **Gatilho:** viewport enter com margem `-100px`, uma vez.
- **Estados:** valor 0 → alvo por `MotionValue/useSpring`; render por `Intl.NumberFormat`; inteiros ou duas casas conforme a métrica.
- **Timing:** spring `59/44/1`; delay/stagger não confirmado além da entrada do contêiner; não inventar.
- **Saída/reentrada:** mantém valor final, não reseta nem reverte; não desmonta.
- **S/D/M:** igual. **Reduced:** renderizar o valor final imediatamente.
- **Implementação/risco:** spring numérico em JS; garantir locale/decimais/sufixos exatos e evitar atualizações de layout desnecessárias.

### 6.7 `global.section-heading-appear`

- **Identificação:** seis headings principais; variável inicial `Ca`, transição `wa`; hint `[data-section-heading]`.
- **Evidência:** seis ocorrências no código e navegador; confiança 100%.
- **Gatilho:** viewport 50%, uma vez, ambas as direções na primeira entrada.
- **Estados:** `opacity:0; y:95px` → `opacity:1; y:0`; sem blur/scale/saída.
- **Timing:** spring `200/40/1`; delay 0; intermediários da mola.
- **Scroll:** triggered, não linked. Reentrada: `VISIBLE_LOCKED`.
- **S/D/M:** mesma distância declarada pelo componente. **Reduced:** final imediato.
- **Implementação/risco:** IntersectionObserver + Motion; observar 50% real, não “quando aparecer um pixel”.

### 6.8 `global.item-stagger-appear`

- **Identificação:** grades, cards, métricas e blocos; `ga` + `_a/ya/ba/xa/Ta/Ea`; hint `[data-reveal-item]`.
- **Evidência:** 13 grupos no código, URL e vídeo; confiança 100%.
- **Gatilho:** viewport enter, threshold 0, `once:true`.
- **Estados:** `opacity:0; y:50px` → `opacity:1; y:0`; sem blur/scale.
- **Timing:** spring `300/60/1`; delays por ordem 0, 200, 400, 600, 800, 1000 ms. Stagger nominal 200 ms; overlap depende do settle da mola.
- **Saída/reentrada:** nenhuma saída; estado final preservado ao retorno rápido de 46,51–52,8 s.
- **S/D/M:** ordem do DOM/layout atual. **Reduced:** todos finais, sem delay.
- **Implementação/risco:** observer por grupo. Não reiniciar quando sair nem confundir o deslocamento natural do scroll com os 50 px internos.

### 6.9 `global.side-illustration-appear`

- **Identificação:** ilustrações/integrations/CTA/testimonial; hint `[data-side-illustration]`.
- **Evidência:** variantes públicas e inspeção ao vivo; confiança 100%.
- **Gatilho:** 50% viewport, uma vez.
- **Estados:** `opacity:0; x:-60px` → `opacity:1; x:0`; sem y/scale/blur.
- **Timing:** spring `500/80/1`, delay 0 salvo orquestração do pai.
- **Saída/reentrada:** nenhuma; final preservado.
- **S/D/M:** aplicar apenas onde a composição lateral existe. **Reduced:** final imediato.
- **Implementação/risco:** Motion/observer. Em layouts empilhados, evitar overflow horizontal durante o estado inicial.

### 6.10 `workflow.desktop-sticky-stage`

- **Identificação:** `#step-trigger-activate`; palco 1136×545; hint `[data-workflow-stage]`.
- **Evidência:** computed style, geometria DOM e vídeo 16,7–33,2 s; confiança 100%.
- **Gatilho:** scroll normal dentro da seção.
- **Estados:** antes do range no fluxo; durante, `position:sticky; top:160px`; depois, liberado no limite do contêiner. Não usa transform para pin.
- **Timing/espaço:** document y≈4155,56; range sticky aproximado `scrollY 3995,56–5800`; sem easing próprio.
- **Scroll:** sticky nativo, não fixed nem JS pin; reversão automática.
- **S/D/M:** somente desktop ≥1200. Em tablet/phone, stack normal. **Reduced:** stack estática e sem sticky.
- **Implementação/risco:** CSS sticky. Pais não podem ter overflow/transform que quebre o containing block.

### 6.11 `workflow.desktop-step-variants`

- **Identificação:** root, `#step-trigger-1`, `#step-trigger-2`; três cards, linha e marcadores.
- **Evidência:** variantes públicas, observers e sequências forward/reverse do vídeo; confiança 100%.
- **Gatilho:** cada target cruza 50%; `animateOnce:false`; ambas as direções; interrompível.
- **Estados:** inactive `[500,500,500]`, line 0, markers `[.5,.5,.5]`; step1 `[0,500,500]`, 33%, `[1,.5,.5]`; step2 `[0,0,500]`, 67%, `[1,1,.5]`; step3 `[0,0,0]`, 100%, `[1,1,1]`.
- **Timing:** Framer duration-spring `duration:600ms; bounce:.2`; sem stagger artificial, pois cada card depende do próprio target.
- **Scroll:** triggered discreto, não scrub. Limiares estimados para viewport CSS 1296: ~3132, ~3868 e ~4770. Tolerância visual ±100–300 ms.
- **S/D/M:** desktop apenas. **Reduced:** três cards em stack final, linha opcional estática a 100%.
- **Implementação/risco:** três observers/estado React. Não converter em faixa horizontal, parallax ou progress mapping contínuo.

### 6.12 `workflow.tablet-phone-static-stack`

- **Identificação:** variante `Mobile` do componente de workflow.
- **Evidência:** DOM em 1024, 810, 809 e 390 px; triggers 1/2 ausentes; confiança 100%.
- **Gatilho/estados:** breakpoint; todos os passos no fluxo, sem alternância temporal, pin ou saída.
- **Timing:** 0 ms. Root pode conservar valor computed `sticky`, mas geometricamente acompanha o fluxo; não há plateau.
- **S/D/M:** desativado no desktop; ativo ≤1199,98. **Reduced:** esta mesma variante em todos os tamanhos.
- **Implementação/risco:** renderização condicional/CSS. Remover também os dois espaçadores de 878 px.

### 6.13 `testimonials.desktop-autoplay`

- **Identificação:** variantes `Testimonial1..5`; hint `[data-testimonial-fan]`.
- **Evidência:** timer/variants no código, live UI e vídeo 35,6–39,7 s; confiança 100%.
- **Gatilho:** autoplay/state change e clique na paginação; reversão não depende de scroll.
- **Estados:** cinco disposições de fan; cada cartão muda transform/layout para o estado da variante. Os valores geométricos finais devem vir do layout visual, não de uma rotação genérica inventada.
- **Timing:** spring `500/60/1`; estados 1–4 permanecem 5000 ms; estado 5 permanece 3000 ms e volta ao 1.
- **Saída/reentrada:** timer continua pelo estado do componente mesmo fora do recorte; paginação seleciona diretamente.
- **S/D/M:** desktop/tablet (≥810). **Reduced:** parar no Testimonial1; cliques trocam instantaneamente.
- **Implementação/risco:** state machine + timeout limpo. Reiniciar o próximo timeout após clique e cancelar no unmount.

### 6.14 `testimonials.phone-ticker`

- **Identificação:** variante phone; hint `[data-testimonial-ticker]`.
- **Evidência:** código e DOM em 390 px; confiança 100%.
- **Gatilho:** loop automático.
- **Estados:** faixa traduz continuamente para a esquerda; gap 30 px; sequência duplicada para wrap.
- **Timing:** velocidade 40 CSS px/s; duração do ciclo deriva da largura real, easing linear.
- **S/D/M:** apenas ≤809,98. **Reduced:** primeiro depoimento estático, todos acessíveis por controle/lista.
- **Implementação/risco:** CSS marquee ou Motion. Recalcular a distância por largura; não herdar o timer 5/3 s do fan.

### 6.15 `button.primary-secondary-hover`

- **Identificação:** CTAs primário/secundário; hints `.button-primary`, `.button-secondary`.
- **Evidência:** variants públicos e hover real; confiança 100%.
- **Gatilho:** hover; reverte em pointerout.
- **Estados:** primário `rgb(3,247,181)` → `rgb(50,217,150)`; secundário mint translúcido/borda → fill mint e texto escuro. `transform:none`; sem seta móvel, ripple, magnetic ou glow.
- **Timing:** spring de duração 400 ms, bounce .2; sem delay.
- **S/D/M:** hover apenas em dispositivos capazes; tap não deve ficar preso. **Reduced:** troca de cor instantânea ou ≤100 ms.
- **Implementação/risco:** CSS pode reproduzir a cor; usar Motion se for necessário casar a mola. Preservar contraste.

### 6.16 `nav.all-pages-dropdown`

- **Identificação:** item “All Pages”; hint `[data-all-pages]` e menu associado.
- **Evidência:** overlay/variants públicos e interação ao vivo; confiança 100%.
- **Gatilho:** hover ou tap; fecha fora; Escape não estava habilitado no original.
- **Estados:** `opacity:0; scale:.95` → `opacity:1; scale:1`; origem no ponto de ancoragem. Posição: abaixo, offset X −60, Y 15, z-index 11. Links opacity ~.75→1.
- **Timing:** menu spring `600/40/.5`; links 450 ms `cubic-bezier(.44,0,.56,1)`.
- **Saída:** mola inversa/overlay dismissal; reexecuta.
- **S/D/M:** desktop/tablet; phone usa painel. **Reduced:** abrir/fechar instantaneamente.
- **Implementação/risco:** popover controlado. Melhorar Escape e foco sem alterar o visual; não copiar a falha de acessibilidade.

### 6.17 `nav.mobile-expand`

- **Identificação:** navegação phone fechada/aberta; hint `[data-mobile-nav]`.
- **Evidência:** variants públicos e clique real em 390 px; confiança 100%.
- **Gatilho:** tap no toggle/state change; reexecuta.
- **Estados:** barra fechada → painel escuro aberto, borda mint alpha de 1 px, radius 8 e backdrop blur 7 px; revela links e “Book a Demo”.
- **Timing:** abrir spring `400/35/.6`; fechar `400/42/1`; sem timer.
- **S/D/M:** ≤809,98. **Reduced:** mudança instantânea, mantendo foco e controles.
- **Implementação/risco:** state/layout animation. Implementar `aria-expanded`, navegação por teclado e retorno de foco.

### 6.18 `faq.accordion`

- **Identificação:** dez rows; hint `[data-faq-item]`; dois abertos inicialmente.
- **Evidência:** variants públicos, clique no live e vídeo 43,2–45,3 s; confiança 100%.
- **Gatilho:** click/tap por item; estado independente; reexecuta.
- **Estados:** fechado `height:72px`, resposta colapsada, plus 0°; aberto `height:auto`, resposta visível, plus 45°. Exemplo aberto 172,78 px, dependente do conteúdo.
- **Keyframes medidos:** 0 ms 72; 40 ms 91,27; 100 ms 143,83; 200 ms 170,88; ~400 ms 172,78.
- **Timing:** spring `400/40/1`; sem fechamento obrigatório do item anterior.
- **S/D/M:** mesma máquina, altura final responsiva. **Reduced:** expansão instantânea.
- **Implementação/risco:** Motion layout/height auto ou medição de `scrollHeight`; overflow hidden durante a transição; preservar os dois estados iniciais.

### 6.19 `form.input-focus`

- **Identificação:** input da CTA; hint `[data-cta-form] input`.
- **Evidência:** before/after focus computed style; confiança 100%.
- **Gatilho:** focus; nenhum estado temporal autoral detectado.
- **Estados/timing:** visual idêntico, 0 ms; sem loading/disabled animado observado.
- **S/D/M:** igual. **Reduced:** igual.
- **Implementação/risco:** adicionar ring `:focus-visible` estático por acessibilidade, sem anunciar isso como reprodução do original.

### 6.20 `cards.noninteractive`

- **Identificação:** cards de features, benefícios e insights; hints semânticos por seção.
- **Evidência:** hover real, DOM e ausência de variants autorais; confiança 100%.
- **Gatilho/estados:** nenhum motion de hover, press, spotlight, tilt, scale, elevação ou border glow. Apenas a entrada `global.item-stagger-appear` pode afetá-los.
- **Timing/saída/reentrada:** 0 ms; n/a.
- **S/D/M/Reduced:** sem diferença temporal.
- **Implementação/risco:** manter estático. Este registro negativo impede “melhorias” que reduziriam a fidelidade.

## 7. Entradas

- Load: cinco ondas do hero, com delays de 200 a 1000 ms.
- Viewport 50%: headings `y95` e ilustrações laterais `x−60`, uma vez.
- Viewport enter: cards/blocos `y50`, delays sequenciais de 200 ms, uma vez.
- Viewport com margem −100 px: contadores numéricos, uma vez.
- Estado/interaction: dropdown `scale .95`, mobile nav, FAQ por height e variantes de depoimentos/workflow.
- O vídeo não contém a entrada de load; seus números vêm do live reload e do código. As entradas de seção no vídeo se misturam ao scroll global e foram separadas por DOM/variants.

## 8. Saídas

Não existe uma saída de viewport para headings, cards, ilustrações, métricas ou hero: `animateOnce:true` os deixa em `VISIBLE_LOCKED`. A saída visual dessas seções no vídeo é scroll natural.

Saídas reais existem apenas como mudança de estado:

- dropdown fecha por pointerout/outside;
- mobile nav fecha por tap;
- FAQ colapsa o item acionado;
- cards do workflow voltam a `y:500px` quando seus observers deixam o estado ativo na reversão;
- testemunhos deixam a posição ativa ao trocar de variante;
- loops fazem wrap, não exit de viewport.

## 9. Reentrada e reversão

Máquinas de estado:

```text
Reveals once: HIDDEN → ENTERING → VISIBLE_LOCKED
About text: BEFORE_RANGE ↔ SCRUBBING ↔ AFTER_RANGE
Workflow: INACTIVE ↔ STEP_1 ↔ STEP_2 ↔ STEP_3
Dropdown/FAQ/nav: CLOSED ↔ TRANSITIONING ↔ OPEN
Testimonials: STATE_1 → 2 → 3 → 4 → 5 → STATE_1
```

O retorno deliberado de 8,1–11,2 s prova a reversão do About. O retorno de 24,3–29,1 s prova a reversão discreta dos steps 3 e 2; o card 1 não desce porque a gravação para a reversão logo acima do threshold correspondente. O retorno rápido 46,51–52,8 s prova que entradas `once` não reiniciam. Mudar direção durante uma spring do workflow troca o target atual; a mola continua da posição intermediária, sem salto.

## 10. Scroll e sticky

Classificação rigorosa:

| Comportamento | Tipo correto | Não é |
| --- | --- | --- |
| deslocamento geral da página | scroll nativo interpolado por Lenis | transform individual |
| header | fixed CSS | sticky ou hide-on-scroll |
| About character color | scroll-linked/scrub | simples viewport reveal |
| headings/cards/ilustrações | scroll-triggered uma vez | scrub/parallax |
| workflow stage | sticky CSS nativo | fixed ou pin JS |
| workflow cards/line | três estados por threshold | horizontal scroll ou scrub contínuo |
| backgrounds/glows | estáticos | parallax/cursor tracking |

O root do workflow está em `documentY≈4155,56`, height 545 e `top:160`; o pin efetivo é aproximadamente `scrollY 3995,56–5800`. Os triggers seguintes têm 878 px de altura em `y≈4724,56` e `5626,56`. Em ≤1199,98 px eles desaparecem e a seção deixa de ter esse espaço temporal.

## 11. Hover e microinterações

- Primário: mint `rgb(3,247,181)` → mint escurecido `rgb(50,217,150)`.
- Secundário: superfície/borda mint translúcida → mint sólido e texto escuro.
- Links do dropdown: opacity aproximada .75→1 em 450 ms.
- Dropdown: abre por hover/tap com opacity + scale; fecha fora.
- FAQ: click/tap altera height e rotação do plus.
- Paginação dos depoimentos: click seleciona uma das cinco variantes.
- Menu phone: tap alterna o painel.
- Teclado/foco: não há motion autoral e o input não ganhou indicação visual mensurável. A implementação deve acrescentar foco estático acessível.
- Ausências confirmadas: card lift, card tilt, spotlight, cursor tracking, ripple, magnetic button, press scale e hover de mockups.

## 12. Loops e efeitos contínuos

| Efeito | Regra | Pausa/wrap | Reduced motion |
| --- | --- | --- | --- |
| Logo marquee | x 0→−2100, 84 s, linear, 25 px/s | duplicado; pausado offscreen | estático |
| Testimonial fan | 1→2→3→4→5; 5 s por 1–4 e 3 s no 5 | volta ao 1 | parar no 1 |
| Testimonial phone | esquerda, 40 px/s, gap30 | sequência duplicada | primeiro item estático |
| Lenis | rAF durante settling do wheel, 600 ms | termina no destino | desabilitado |

Não foram detectados floating decorativo, partículas, vídeo, Lottie, canvas, WebGL, glow pulsante, background animado ou parallax ambiental.

## 13. Motion tokens

Valores de origem, sem homogeneização artificial:

```css
:root {
  --motion-lenis-duration: 600ms;
  --motion-lenis-ease: min(1, 1.001 - pow(2, -10 * t)); /* função JS */

  --motion-tween-about: 300ms;
  --motion-ease-about: ease-in-out;
  --motion-tween-nav-link: 450ms;
  --motion-ease-nav-link: cubic-bezier(.44, 0, .56, 1);
  --motion-marquee-cycle: 84000ms;

  --motion-distance-hero-y: 160px;
  --motion-distance-heading-y: 95px;
  --motion-distance-item-y: 50px;
  --motion-distance-side-x: -60px;
  --motion-distance-workflow-y: 500px;

  --motion-delay-1: 200ms;
  --motion-delay-2: 400ms;
  --motion-delay-3: 600ms;
  --motion-delay-4: 800ms;
  --motion-delay-5: 1000ms;
}
```

| Token spring | Stiffness | Damping | Mass | Duração/bounce especial |
| --- | ---: | ---: | ---: | --- |
| hero/heading base | 200 | 40 | 1 | settle observado ~1120 ms |
| item reveal | 300 | 60 | 1 | solver |
| side illustration | 500 | 80 | 1 | solver |
| counter | 59 | 44 | 1 | solver numérico |
| testimonial | 500 | 60 | 1 | solver |
| FAQ | 400 | 40 | 1 | settle visual ~400 ms |
| desktop nav | 400 | 40 | 1 | solver |
| dropdown | 600 | 40 | .5 | solver |
| mobile nav open | 400 | 35 | .6 | solver |
| mobile nav close | 400 | 42 | 1 | solver |
| workflow variant | — | — | — | duration 600 ms, bounce .2 |
| button variant | — | — | — | duration 400 ms, bounce .2 |

Thresholds: heading/side illustration/workflow = 50%; item reveal = 0%; counter = margin −100 px; About = `start 75%` até `start 15%`. Opacity inicial padrão = 0, exceto hero = .001; marcadores do workflow inativos = .5.

## 14. Tecnologias e estratégia

Tecnologia original confirmada: Framer Sites/React + Motion, Lenis 1.1.2, IntersectionObserver, MotionValue/useSpring, `requestAnimationFrame` e CSS sticky. Não foram detectados GSAP, ScrollTrigger, Lottie, Rive, Three.js, canvas, WebGL, `scroll-timeline` ou pin por JavaScript.

Estratégia recomendada:

- Se o projeto de destino for React, usar Motion para springs, layout/height e variantes; IntersectionObserver ou `whileInView` para triggers.
- Usar Lenis apenas para wheel/no-preference; não adicionar GSAP.
- Usar CSS para fixed/sticky, marquee linear e superfícies estáticas.
- Usar JS/Motion para About por caractere, contadores, observers do workflow, timers dos depoimentos, dropdown/menu e FAQ.
- Canvas/WebGL: nenhuma dependência necessária.

Nota DevTools: `getAnimations()` pode apresentar easing `linear` e centenas de keyframes. O Framer converte springs em amostras WAAPI; a fonte `stiffness/damping/mass` tem precedência. Copiar os keyframes densos seria frágil e desnecessário.

Riscos de performance: spans por caractere podem aumentar DOM; limitar updates do About a MotionValues/transformação de cor, não React state por frame. Cancelar timers/RAF no unmount. Usar um observer compartilhado onde possível. Não animar layout de toda a página durante FAQ; restringir ao item. `will-change` deve existir só durante transições.

## 15. Responsividade

Breakpoints exatos:

- Desktop: `min-width:1200px`.
- Tablet: `810px–1199.98px`.
- Phone: `max-width:809.98px`.

| Viewport testada | Page height CSS | Motion distintivo |
| --- | ---: | --- |
| 1920×975 | 11835 | desktop workflow + fan |
| 1200×800 | 11835 | último desktop |
| 1024×768 | 12045 | stack workflow + fan |
| 810×760 | 12205 | último tablet |
| 809×760 | 14695 | phone nav + ticker |
| 768×740 | 14695 | phone nav + ticker |
| 390×844 | 15757 | phone nav + ticker |

Regras:

- O workflow desktop e seus dois triggers de 878 px existem somente a partir de 1200 px. Tablet/phone exibem todos os passos em stack e não simulam pin.
- O fan de depoimentos permanece em tablet; só troca para ticker em 809,98 px ou menos.
- A navegação expansível também começa no breakpoint phone.
- About recalcula o progresso por posição real após reflow de linhas.
- Reveals `once` permanecem, mas devem observar a ordem DOM de cada composição.
- Hover de botões/dropdown só deve depender de hover em dispositivos com `(hover:hover)`; tap permanece funcional.

## 16. Reduced motion

O comportamento original foi testado em Chromium com `prefers-reduced-motion: reduce`: ainda havia 18 animações do hero aos 100 ms, com durações de 600/1120 ms. Portanto o original **não oferece fallback suficiente**.

Contrato obrigatório para a reprodução acessível:

```text
prefers-reduced-motion: reduce
├─ desativar Lenis; scroll nativo auto
├─ hero, headings, cards e ilustrações já no estado final
├─ contadores no número final
├─ About completamente branco, sem scrub
├─ workflow em stack estática, sem sticky/triggers
├─ parar marquee e ticker
├─ parar autoplay; deixar depoimento 1 e paginação funcional
└─ dropdown, menu e FAQ instantâneos; nenhuma informação escondida
```

Focus, click, navegação e paginação continuam funcionais; redução de movimento não pode significar remoção de conteúdo.

## 17. Arquivo `motion-spec.json`

O arquivo estruturado está em [motion-spec.json](motion-spec.json). Ele contém:

- `metadata`: URL, arquivo, duração, resolução, viewport/zoom e limitações;
- `motionTokens`: 12 springs, tweens, distâncias, delays e thresholds;
- `videoTimeline`: 15 segmentos normalizados;
- `animations`: 20 registros com estados, triggers, timing, repetição, responsividade, reduced motion, evidência e confiança;
- `responsive`, `reducedMotion`, `implementationOrder` e `doNotInvent`.

O JSON foi parseado nativamente após a geração; não contém comentários, `Infinity`, trailing comma ou campos sintaticamente inválidos. Números exatos do código são números; estimativas e tolerâncias são explicitamente nomeadas.

## 18. INSTRUÇÕES DIRETAS PARA IMPLEMENTAÇÃO

1. Tratar [motion-spec.json](motion-spec.json) como fonte de verdade e este relatório como justificativa/evidência.
2. Verificar primeiro a geometria em 2560×1296 CSS (equivalente ao vídeo em 75%), depois 1920×975, 1024×768, 810×760, 809×760 e 390×844.
3. Instalar/configurar os tokens globais e o switch `prefers-reduced-motion` antes dos componentes.
4. Aplicar Lenis 600 ms apenas a wheel e somente em `no-preference`; preservar toque nativo.
5. Implementar o hero com Motion spring e cinco delays. Não reproduzir as amostras WAAPI como tween linear.
6. Implementar headings/cards/ilustrações via IntersectionObserver, com `once:true`, thresholds e offsets exatos.
7. Implementar About com progress por caractere e os quatro counters em spring numérico.
8. Implementar workflow desktop como CSS sticky + três observers de 50% + variantes verticais de 500 px. **Substituir qualquer implementação horizontal ou progressiva já existente.** Em ≤1199,98 px usar stack estática e remover os espaçadores.
9. Implementar fan/timer/paginação de depoimentos para ≥810 px e ticker de 40 px/s para phone.
10. Implementar botões, dropdown, menu phone e FAQ com seus springs específicos. Melhorias de teclado/foco podem ser estáticas.
11. Manter backgrounds, glows, mockups e cards sem animações adicionais. Excluir badges promocionais Framer/Pentaclay do produto.
12. Validar forward e reverse contra [workflow forward](motion-analysis/contact-workflow-forward.jpg), [workflow reverse](motion-analysis/contact-workflow-reverse.jpg), [About reverse](motion-analysis/contact-about-reverse-forward.jpg), [testimonial autoplay](motion-analysis/contact-testimonial-autoplay.jpg) e [FAQ hold](motion-analysis/contact-faq-hold.jpg).

Não simplificáveis sem divergência: springs de entrada, thresholds/once, character scrub, sticky + estados do workflow, timers/variants de depoimentos e FAQ height spring. Podem ser CSS sem diferença perceptível: marquee, fixed header, superfícies estáticas e troca cromática dos botões, desde que duração/estado coincidam.

Critérios de aceite para o Prompt 2:

- em scroll reverso, apenas About/workflow revertem;
- o segundo e terceiro cards do workflow entram e saem nos thresholds corretos, nunca por scroll horizontal;
- após voltar ao topo, reveals comuns não repetem;
- os depoimentos mudam durante uma pausa de scroll;
- FAQ inicia com exatamente dois itens abertos e permite múltiplos abertos;
- em 1199 px não há pin; em 809 px há ticker/menu phone;
- em reduced motion não há movimento automático e todo conteúdo permanece acessível;
- console sem erros e nenhum layout shift causado por estados iniciais.

## 19. Pendências e limites

Não há comportamento bloqueante pendente para a implementação. Permanecem apenas estes limites documentais:

- O vídeo começa depois do load reveal; os timings correspondentes foram confirmados por reload/código, não por frames do arquivo.
- A geometria interna exata das cinco variantes do fan de depoimentos é responsiva e deve ser lida do layout visual/DOM; o comportamento temporal está completamente determinado.
- Não houve cursor visível sobre todos os links nem teclado no vídeo; hover/click/focus foram testados na URL.
- O áudio existe no arquivo, mas não controla nenhuma animação identificada.
- A publicidade fixa Framer/Pentaclay pertence à plataforma/template, não à interface a reproduzir.

## Checklist de validação da análise

- [x] Todas as seções e toda a duração do vídeo analisadas.
- [x] Scroll para baixo, para cima, pausas e mudança de direção considerados.
- [x] Reentrada separada de entrada inicial.
- [x] Scroll natural, fixed, sticky, triggered e linked separados.
- [x] Timings exatos vinculados ao código e estimativas marcadas com tolerância.
- [x] Loops, autoplay, hover, click, tap, foco e responsividade investigados na URL.
- [x] Reduced motion testado e contrato alternativo especificado.
- [x] Matriz, timelines por seção, tokens, máquinas de estado e handoff incluídos.
- [x] `motion-spec.json` gerado e validado.
- [x] Nenhuma interação ausente foi inventada e nenhuma página foi implementada nesta fase.
