/* =====================================================================
   Escuela deleFOCO — Formación B2C
   Theme · Form · Carousel · Timeline · Mobile nav · Analytics
   ===================================================================== */

/* ---------- Theme toggle ---------- */
const body = document.body;
const toggle = document.getElementById("colorToggle");

function setTheme(dark) {
  body.classList.toggle("theme-dark", dark);
  body.classList.toggle("theme-light", !dark);
  try {
    localStorage.setItem("delefoco-theme", dark ? "dark" : "light");
  } catch (_) {}
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(dark));
    const label = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    const icon = toggle.querySelector(".color-toggle-icon");
    const text = toggle.querySelector(".color-toggle-text");
    if (icon) icon.textContent = dark ? "☾" : "☀";
    if (text) text.textContent = dark ? "Oscuro" : "Claro";
  }
}

(function initTheme() {
  let dark = true;
  try {
    const saved = localStorage.getItem("delefoco-theme");
    if (saved === "light") dark = false;
    else if (saved === "dark") dark = true;
  } catch (_) {}
  setTheme(dark);
})();

toggle?.addEventListener("click", () => {
  setTheme(body.classList.contains("theme-light"));
});

/* ---------- Analytics (sección 12 del plan) ---------- */
function trackEvent(name, payload = {}) {
  const detail = { event: name, page: "formacion-b2b", ...payload };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(detail);
  if (typeof window.gtag === "function") window.gtag("event", name, payload);
  console.debug("[deleFOCO analytics]", detail);
}

document.querySelectorAll("[data-event]").forEach((el) => {
  el.addEventListener("click", () => {
    trackEvent(el.getAttribute("data-event"), {
      course: el.getAttribute("data-course") || undefined,
      href: el.getAttribute("href") || undefined,
    });
  });
});

/* ---------- WhatsApp form submit ---------- */
document.getElementById("whatsappSubmit")?.addEventListener("click", () => {
  const form = document.getElementById("leadForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  if (!form.checkValidity()) {
    status.textContent = (I18N[currentLang] && I18N[currentLang].form_status_required) || "Completá los campos obligatorios marcados.";
    form.reportValidity();
    return;
  }

  const lines = [form.dataset.title || "Hola, quiero información sobre formación en deleFOCO:", ""];
  form.querySelectorAll("label").forEach((label) => {
    const field = label.querySelector("input, select, textarea");
    const span = label.querySelector("span");
    if (field && span && field.value.trim()) {
      lines.push(`${span.textContent}: ${field.value.trim()}`);
    }
  });

  trackEvent("course_registration", {
    course: form.querySelector('[name="course"]')?.value || "",
    mode: form.querySelector('[name="mode"]')?.value || "",
  });

  status.textContent = (I18N[currentLang] && I18N[currentLang].form_status_opening) || "Abriendo WhatsApp…";
  const opened = window.open(
    "https://wa.me/50686823430?text=" + encodeURIComponent(lines.join("\n")),
    "_blank",
    "noopener,noreferrer"
  );
  if (!opened) {
    status.textContent = (I18N[currentLang] && I18N[currentLang].form_status_blocked) || "El navegador bloqueó la ventana. Permití pop-ups e intentá de nuevo.";
  } else {
    status.textContent = (I18N[currentLang] && I18N[currentLang].form_status_ok) || "Listo. Si no se abrió WhatsApp, revisá los pop-ups.";
  }
});

/* ---------- Prefill course from catalog CTA ---------- */
const courseMap = {
  "actuacion-camara": "Locaciones deleFOCO",
  "preparacion-casting": "Casting y talento",
  "creacion-contenido": "Producción de punta a punta",
  "produccion-audiovisual": "Estudios y equipo técnico",
  "comunicacion-oratoria": "Contenido para marcas",
  "presencia-imagen": "Capacitación para equipos"
};

document.querySelectorAll("[data-course][href='#contacto']").forEach((el) => {
  el.addEventListener("click", () => {
    const select = document.querySelector('select[name="course"]');
    if (!select) return;
    const key = el.getAttribute("data-course");
    const idx = { "actuacion-camara": 0, "preparacion-casting": 1, "creacion-contenido": 2, "produccion-audiovisual": 3, "comunicacion-oratoria": 4, "presencia-imagen": 5 }[key];
    if (idx == null) return;
    const lang = typeof currentLang !== "undefined" ? currentLang : "es";
    const list = (typeof COURSE_OPTIONS !== "undefined" && COURSE_OPTIONS[lang]) ? COURSE_OPTIONS[lang] : null;
    if (list && list[idx]) select.value = list[idx];
    else if (typeof courseMap !== "undefined" && courseMap[key]) select.value = courseMap[key];
  });
});

/* ---------- Header shadow on scroll ---------- */
const topbar = document.querySelector(".topbar");
const onScroll = () => topbar?.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Timeline animation ---------- */
const timeline = document.querySelector(".timeline");
if (timeline) {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            timeline.classList.add("is-visible");
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(timeline);
  } else {
    timeline.classList.add("is-visible");
  }
}

/* ---------- Hero carousel ---------- */
(function () {
  const root = document.getElementById("heroCarousel");
  if (!root) return;
  const slides = Array.from(root.querySelectorAll(".hero-carousel-slide"));
  const dots = Array.from(root.querySelectorAll(".hero-carousel-dots button"));
  const prevBtn = document.getElementById("heroCarouselPrev");
  const nextBtn = document.getElementById("heroCarouselNext");
  let current = 0;
  let timer = null;
  const AUTOPLAY_MS = 5000;

  function goTo(index) {
    slides[current]?.classList.remove("active");
    dots[current]?.classList.remove("active");
    dots[current]?.setAttribute("aria-selected", "false");
    current = (index + slides.length) % slides.length;
    slides[current]?.classList.add("active");
    dots[current]?.classList.add("active");
    dots[current]?.setAttribute("aria-selected", "true");
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  prevBtn?.addEventListener("click", () => { prev(); startAutoplay(); });
  nextBtn?.addEventListener("click", () => { next(); startAutoplay(); });
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => { goTo(i); startAutoplay(); });
  });

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", startAutoplay);

  startAutoplay();
})();

/* ---------- Mobile navigation ---------- */
(function () {
  const btn = document.getElementById("menuToggle");
  const panel = document.getElementById("mobileNav");
  if (!btn || !panel) return;

  function open() {
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Cerrar menú");
    body.classList.add("nav-open");
  }
  function close() {
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Abrir menú");
    body.classList.remove("nav-open");
  }
  function toggleMenu() {
    if (panel.hidden) open();
    else close();
  }

  btn.addEventListener("click", toggleMenu);

  panel.addEventListener("click", (e) => {
    if (e.target === panel) close();
  });

  panel.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => close());
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1050 && !panel.hidden) close();
  });
})();

/* ---------- In-page language toggle (ES / EN) ---------- */
const I18N = {
  es: {
    skip: "Saltar al contenido",
    nav_areas: "Áreas",
    nav_cursos: "Cursos",
    nav_proceso: "Proceso",
    nav_faq: "Preguntas",
    nav_inscripcion: "Inscripción",
    mode_b2b: "Contratar servicios",
    mode_b2c: "Quiero ser parte",
    cta_asesor: "Hablar con un asesor",
    hero_eyebrow: "APRENDÉ SOBRE deleFOCO · CONTRATAR SERVICIOS",
    hero_title: "Conocé todo lo que<br><span>deleFOCO ofrece.</span>",
    hero_sub: "Talleres y sesiones para entender cómo funcionan nuestras locaciones, casting, talento, producción y estudios, y contratar con criterio.",
    hero_cta_cursos: "Ver cursos <span>→</span>",
    hero_cta_inscribir: "Inscribirme",
    hero_m1: "Conocé",
    hero_m2: "Entendé",
    hero_m3: "Contratá",
    hero_tag: "ESCUELA deleFOCO",
    trust_1: "años impulsando el audiovisual",
    trust_2: "Escuela audiovisual en Costa Rica",
    trust_3: "acompañamiento dentro del ecosistema",
    trust_4: "orientado a práctica real",
    areas_eyebrow: "LO QUE OFRECEMOS",
    areas_title: "Aprendé qué podés contratar en deleFOCO.",
    areas_sub: "Cada área explica el servicio, cómo se trabaja y cuándo conviene.",
    area_1_t: "Locaciones",
    area_1_d: "Cómo elegir, reservar y filmar en espacios de la red deleFOCO.",
    area_2_t: "Casting y talento",
    area_2_d: "Cómo se busca, selecciona y contrata talento para tu proyecto.",
    area_3_t: "Producción audiovisual",
    area_3_d: "Qué incluye una producción y cómo se coordina de punta a punta.",
    area_4_t: "Estudios y equipo",
    area_4_d: "Qué estudios, cámaras e iluminación hay disponibles y cómo usarlos.",
    area_5_t: "Contenido para marcas",
    area_5_d: "Cómo se planifica video y contenido para empresas y redes.",
    area_6_t: "Formación para equipos",
    area_6_d: "Capacitaciones a medida para que tu equipo trabaje con el sector.",
    proc_eyebrow: "CÓMO FUNCIONA",
    proc_title: "De conocer a contratar.",
    proc_sub: "Un camino claro para entender nuestros servicios antes de contratarlos.",
    proc_1_t: "Explorá",
    proc_1_d: "Conocé los servicios y talleres informativos disponibles.",
    proc_2_t: "Elegí",
    proc_2_d: "Seleccioná el tema que necesita tu empresa o proyecto.",
    proc_3_t: "Solicitá",
    proc_3_d: "Pedí la sesión o charla y coordinamos fecha y modalidad.",
    proc_4_t: "Contratá",
    proc_4_d: "Con la información clara, contratá los servicios que necesitás.",
    cursos_eyebrow: "TALLERES INFORMATIVOS",
    cursos_title: "Elegí qué querés conocer.",
    cursos_sub: "Sesiones prácticas para productoras, marcas y particulares. Fechas, precios y cupos se confirman al consultar.",
    label_nivel: "Nivel:",
    label_modalidad: "Modalidad:",
    label_enfoque: "Enfoque:",
    c1_t: "Locaciones deleFOCO",
    c1_d: "Cómo buscar, reservar y filmar en nuestra red de locaciones.",
    c1_nivel: "Inicial",
    c1_mod: "Presencial / Híbrida",
    c1_enf: "Reservas, requisitos y rodaje",
    c2_t: "Casting y talento",
    c2_d: "Cómo funciona un casting y cómo contratar talento.",
    c2_nivel: "Inicial / Intermedio",
    c2_mod: "Presencial",
    c2_enf: "Perfiles, audiciones y contratación",
    c3_t: "Producción de punta a punta",
    c3_d: "Qué incluye producir con deleFOCO, de la idea a la entrega.",
    c3_nivel: "Inicial",
    c3_mod: "Presencial / Virtual",
    c3_enf: "Preproducción, rodaje y entrega",
    c4_t: "Estudios y equipo técnico",
    c4_d: "Conocé los estudios, la iluminación y el equipo disponible.",
    c4_nivel: "Inicial / Intermedio",
    c4_mod: "Presencial",
    c4_enf: "Estudios, luces y cámaras",
    c5_t: "Contenido para marcas",
    c5_d: "Cómo planificar video y contenido con deleFOCO.",
    c5_nivel: "Inicial",
    c5_mod: "Presencial / Virtual",
    c5_enf: "Planificación y formatos",
    c6_t: "Capacitación para equipos",
    c6_d: "Formación a medida para el equipo de tu empresa.",
    c6_nivel: "Inicial",
    c6_mod: "Presencial",
    c6_enf: "Contenidos a medida",
    curso_cta: "Consultar / Inscribirme →",
    form_eyebrow: "SOLICITUD",
    form_title: "Pedí tu sesión.",
    form_sub: "Dejanos tus datos y el tema que querés conocer. Te contactamos para coordinar la sesión y resolver tus dudas sobre contratar.",
    label_nombre: "Nombre completo",
    label_correo: "Correo",
    label_curso: "Tema de interés",
    label_mod_pref: "Modalidad preferida",
    label_nivel_exp: "Nivel de experiencia",
    label_whatsapp: "WhatsApp",
    label_mensaje: "Mensaje (opcional)",
    form_btn: "Inscribirme <span>→</span>",
    faq_eyebrow: "PREGUNTAS FRECUENTES",
    faq_title: "Todo lo que querés saber.",
    faq_sub: "Resolvemos tus dudas sobre qué ofrece deleFOCO y cómo contratar.",
    faq_pt1: "Cursos para todos los niveles",
    faq_pt2: "Presencial, virtual o híbrido",
    faq_pt3: "Acompañamiento personalizado",
    faq_help_t: "¿Todavía tenés dudas?",
    faq_help_d: "Escribinos y te orientamos a elegir la formación ideal para vos.",
    faq_help_form: "Ir al formulario",
    faq_1_q: "¿Necesito conocimientos previos?",
    faq_1_a: "No. Las sesiones están pensadas para explicar los servicios desde cero, sin importar tu experiencia en el sector.",
    faq_2_q: "¿Cómo sé qué curso elegir?",
    faq_2_a: "Revisá el objetivo, nivel, modalidad y enfoque de cada curso. Si no estás seguro, escribinos por WhatsApp o en el formulario y te orientamos según tus intereses.",
    faq_3_q: "¿Los cursos son presenciales, virtuales o híbridos?",
    faq_3_a: "La modalidad depende de cada programa. En la ficha del curso y al consultar te indicamos si es presencial, virtual o híbrida.",
    faq_4_q: "¿Cuánto cuesta un curso?",
    faq_4_a: "El precio depende del programa, duración y modalidad. Cada curso muestra su precio antes del proceso de inscripción o al contactarnos.",
    faq_5_q: "¿Los cursos tienen cupos limitados?",
    faq_5_a: "Sí, varios programas tienen cupos limitados para mantener un formato práctico. La disponibilidad se confirma al momento de la consulta o matrícula.",
    faq_6_q: "¿Puedo contratar después de la sesión?",
    faq_6_a: "Sí. Al terminar te orientamos para contratar los servicios que se ajusten a tu proyecto.",
    final_title: "Conocé deleFOCO y contratá con confianza.",
    final_sub: "Aprendé todo lo que ofrecemos y encontrá el servicio ideal para tu proyecto.",
    final_cta: "Inscribirme →",
    final_wa: "Hablar por WhatsApp",
    footer_social: "Conectá con la comunidad audiovisual",
    footer_brand: "Comunidad audiovisual · San José, Costa Rica",
    footer_ubicacion: "UBICACIÓN",
    footer_contacto: "CONTACTO",
    footer_eco: "ECOSISTEMA",
    social_follow: "Seguinos",
    social_fb: "en Facebook",
    social_ig: "en Instagram",
    social_x: "en X",
    social_write: "Escribinos",
    social_wa: "en WhatsApp",
    doc_title: "Formación · Quiero ser parte | Escuela deleFOCO",
    form_title_wa: "Hola, quiero conocer y aprender sobre los servicios de deleFOCO para contratar:",
    form_status_required: "Completá los campos obligatorios marcados.",
    form_status_opening: "Abriendo WhatsApp…",
    form_status_blocked: "El navegador bloqueó la ventana. Permití pop-ups e intentá de nuevo.",
    form_status_ok: "Listo. Si no se abrió WhatsApp, revisá los pop-ups.",
    opt_select_course: "Seleccioná un tema",
    opt_other: "Otro / No estoy seguro",
    opt_select: "Seleccioná una opción",
    opt_optional: "Opcional",
    opt_presencial: "Presencial",
    opt_virtual: "Virtual",
    opt_hibrida: "Híbrida",
    opt_indistinto: "Indistinto",
    opt_inicial: "Inicial",
    opt_intermedio: "Intermedio",
    opt_avanzado: "Avanzado",
    ph_name: "Tu nombre",
    ph_email: "tu@email.com",
    ph_phone: "8888-8888",
    ph_message: "Contanos qué querés conocer de nuestros servicios.",
    theme_to_light: "Cambiar a modo claro",
    theme_to_dark: "Cambiar a modo oscuro",
    theme_dark: "Oscuro",
    theme_light: "Claro",
    menu_open: "Abrir menú",
    menu_close: "Cerrar menú",
  },
  en: {
    skip: "Skip to content",
    nav_areas: "Areas",
    nav_cursos: "Courses",
    nav_proceso: "Process",
    nav_faq: "FAQ",
    nav_inscripcion: "Enroll",
    mode_b2b: "Hire services",
    mode_b2c: "I want to join",
    cta_asesor: "Talk to an advisor",
    hero_eyebrow: "LEARN ABOUT deleFOCO · HIRE SERVICES",
    hero_title: "Discover everything<br><span>deleFOCO offers.</span>",
    hero_sub: "Workshops and sessions to understand how our locations, casting, talent, production and studios work, so you can hire with confidence.",
    hero_cta_cursos: "View courses <span>→</span>",
    hero_cta_inscribir: "Enroll",
    hero_m1: "Discover",
    hero_m2: "Understand",
    hero_m3: "Hire",
    hero_tag: "deleFOCO SCHOOL",
    trust_1: "years driving audiovisual",
    trust_2: "Audiovisual school in Costa Rica",
    trust_3: "support within the ecosystem",
    trust_4: "oriented to real practice",
    areas_eyebrow: "WHAT WE OFFER",
    areas_title: "Learn what you can hire at deleFOCO.",
    areas_sub: "Each area explains the service, how we work and when it fits.",
    area_1_t: "Locations",
    area_1_d: "How to choose, book and shoot in deleFOCO network spaces.",
    area_2_t: "Casting & talent",
    area_2_d: "How talent is sourced, selected and hired for your project.",
    area_3_t: "Audiovisual production",
    area_3_d: "What a production includes and how it is coordinated end to end.",
    area_4_t: "Studios & equipment",
    area_4_d: "Which studios, cameras and lighting are available and how to use them.",
    area_5_t: "Brand content",
    area_5_d: "How video and content for companies and social media is planned.",
    area_6_t: "Team training",
    area_6_d: "Tailored training so your team can work with the sector.",
    proc_eyebrow: "HOW IT WORKS",
    proc_title: "From learning to hiring.",
    proc_sub: "A clear path to understand our services before hiring them.",
    proc_1_t: "Explore",
    proc_1_d: "Browse the available services and informational workshops.",
    proc_2_t: "Choose",
    proc_2_d: "Pick the topic your company or project needs.",
    proc_3_t: "Request",
    proc_3_d: "Request the session or talk and we will arrange date and format.",
    proc_4_t: "Hire",
    proc_4_d: "With clear information, hire the services you need.",
    cursos_eyebrow: "INFORMATIONAL WORKSHOPS",
    cursos_title: "Choose what you want to learn about.",
    cursos_sub: "Practical sessions for production companies, brands and individuals. Dates, prices and spots are confirmed on request.",
    label_nivel: "Level:",
    label_modalidad: "Format:",
    label_enfoque: "Focus:",
    c1_t: "deleFOCO locations",
    c1_d: "How to search, book and shoot across our network of locations.",
    c1_nivel: "Beginner",
    c1_mod: "In person / Hybrid",
    c1_enf: "Bookings, requirements and shooting",
    c2_t: "Casting & talent",
    c2_d: "How a casting works and how to hire talent.",
    c2_nivel: "Beginner / Intermediate",
    c2_mod: "In person",
    c2_enf: "Profiles, auditions and hiring",
    c3_t: "End-to-end production",
    c3_d: "What producing with deleFOCO includes, from idea to delivery.",
    c3_nivel: "Beginner",
    c3_mod: "In person / Online",
    c3_enf: "Pre-production, shooting and delivery",
    c4_t: "Studios & technical equipment",
    c4_d: "Get to know the studios, lighting and equipment available.",
    c4_nivel: "Beginner / Intermediate",
    c4_mod: "In person",
    c4_enf: "Studios, lighting and cameras",
    c5_t: "Content for brands",
    c5_d: "How to plan video and content with deleFOCO.",
    c5_nivel: "Beginner",
    c5_mod: "In person / Online",
    c5_enf: "Planning and formats",
    c6_t: "Team training",
    c6_d: "Tailored training for your company team.",
    c6_nivel: "Beginner",
    c6_mod: "In person",
    c6_enf: "Tailored content",
    curso_cta: "Inquire / Enroll →",
    form_eyebrow: "REQUEST",
    form_title: "Request your session.",
    form_sub: "Leave your details and the topic you want to learn about. We will contact you to schedule the session and answer your hiring questions.",
    label_nombre: "Full name",
    label_correo: "Email",
    label_curso: "Topic of interest",
    label_mod_pref: "Preferred format",
    label_nivel_exp: "Experience level",
    label_whatsapp: "WhatsApp",
    label_mensaje: "Message (optional)",
    form_btn: "Enroll <span>→</span>",
    faq_eyebrow: "FREQUENTLY ASKED QUESTIONS",
    faq_title: "Everything you want to know.",
    faq_sub: "We answer your questions about what deleFOCO offers and how to hire.",
    faq_pt1: "Courses for every level",
    faq_pt2: "In person, online or hybrid",
    faq_pt3: "Personalized guidance",
    faq_help_t: "Still have questions?",
    faq_help_d: "Message us and we'll help you choose the right training.",
    faq_help_form: "Go to the form",
    faq_1_q: "Do I need prior knowledge?",
    faq_1_a: "No. Sessions explain the services from scratch, regardless of your experience in the sector.",
    faq_2_q: "How do I know which course to choose?",
    faq_2_a: "Review the objective, level, format and focus of each course. If you're not sure, message us on WhatsApp or use the form and we'll guide you.",
    faq_3_q: "Are courses in person, online or hybrid?",
    faq_3_a: "The format depends on each program. On the course info and when you inquire we'll tell you if it's in person, online or hybrid.",
    faq_4_q: "How much does a course cost?",
    faq_4_a: "Price depends on the program, duration and format. Each course shows its price before enrollment or when you contact us.",
    faq_5_q: "Are spots limited?",
    faq_5_a: "Yes, several programs have limited spots to keep a practical format. Availability is confirmed when you inquire or enroll.",
    faq_6_q: "Can I hire after the session?",
    faq_6_a: "Yes. Afterwards we guide you to hire the services that fit your project.",
    final_title: "Know deleFOCO and hire with confidence.",
    final_sub: "Learn everything we offer and find the right service for your project.",
    final_cta: "Enroll →",
    final_wa: "Chat on WhatsApp",
    footer_social: "Connect with the audiovisual community",
    footer_brand: "Audiovisual community · San José, Costa Rica",
    footer_ubicacion: "LOCATION",
    footer_contacto: "CONTACT",
    footer_eco: "ECOSYSTEM",
    social_follow: "Follow us",
    social_fb: "on Facebook",
    social_ig: "on Instagram",
    social_x: "on X",
    social_write: "Write us",
    social_wa: "on WhatsApp",
    doc_title: "Training · I want to join | deleFOCO School",
    form_title_wa: "Hi, I want to learn about deleFOCO services in order to hire:",
    form_status_required: "Please fill in the required fields.",
    form_status_opening: "Opening WhatsApp…",
    form_status_blocked: "The browser blocked the window. Allow pop-ups and try again.",
    form_status_ok: "Done. If WhatsApp didn't open, check pop-ups.",
    opt_select_course: "Select a topic",
    opt_other: "Other / Not sure",
    opt_select: "Select an option",
    opt_optional: "Optional",
    opt_presencial: "In person",
    opt_virtual: "Online",
    opt_hibrida: "Hybrid",
    opt_indistinto: "Either",
    opt_inicial: "Beginner",
    opt_intermedio: "Intermediate",
    opt_avanzado: "Advanced",
    ph_name: "Your name",
    ph_email: "you@email.com",
    ph_phone: "8888-8888",
    ph_message: "Tell us what you want to know about our services.",
    theme_to_light: "Switch to light mode",
    theme_to_dark: "Switch to dark mode",
    theme_dark: "Dark",
    theme_light: "Light",
    menu_open: "Open menu",
    menu_close: "Close menu",
  },
};

const COURSE_OPTIONS = {
  "es": [
    "Locaciones deleFOCO",
    "Casting y talento",
    "Producción de punta a punta",
    "Estudios y equipo técnico",
    "Contenido para marcas",
    "Capacitación para equipos"
  ],
  "en": [
    "deleFOCO locations",
    "Casting & talent",
    "End-to-end production",
    "Studios & technical equipment",
    "Brand content",
    "Team training"
  ]
};

let currentLang = "es";

function applyLanguage(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang === "en" ? "en" : "es";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = I18N[lang][key];
    if (val == null) return;
    if (el.hasAttribute("data-i18n-html") || /<[^>]+>/.test(val)) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });

  // Document title
  if (I18N[lang].doc_title) document.title = I18N[lang].doc_title;

  // Form dataset title for WhatsApp
  const form = document.getElementById("leadForm");
  if (form && I18N[lang].form_title_wa) form.dataset.title = I18N[lang].form_title_wa;

  // Placeholders
  const name = form?.querySelector('[name="name"]');
  const email = form?.querySelector('[name="email"]');
  const phone = form?.querySelector('[name="phone"]');
  const message = form?.querySelector('[name="message"]');
  if (name) name.placeholder = I18N[lang].ph_name;
  if (email) email.placeholder = I18N[lang].ph_email;
  if (phone) phone.placeholder = I18N[lang].ph_phone;
  if (message) message.placeholder = I18N[lang].ph_message;

  // Select options
  const courseSelect = form?.querySelector('[name="course"]');
  if (courseSelect) {
    const prev = courseSelect.selectedIndex;
    const courses = COURSE_OPTIONS[lang];
    courseSelect.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value = "";
    o0.textContent = I18N[lang].opt_select_course;
    courseSelect.appendChild(o0);
    courses.forEach((c) => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      courseSelect.appendChild(o);
    });
    const oOther = document.createElement("option");
    oOther.value = I18N[lang].opt_other;
    oOther.textContent = I18N[lang].opt_other;
    courseSelect.appendChild(oOther);
    if (prev >= 0 && prev < courseSelect.options.length) courseSelect.selectedIndex = prev;
  }

  const modeSelect = form?.querySelector('[name="mode"]');
  if (modeSelect) {
    const prev = modeSelect.value;
    const modes = [
      ["", I18N[lang].opt_select],
      ["Presencial", I18N[lang].opt_presencial],
      ["Virtual", I18N[lang].opt_virtual],
      ["Híbrida", I18N[lang].opt_hibrida],
      ["Indistinto", I18N[lang].opt_indistinto],
    ];
    modeSelect.innerHTML = "";
    modes.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      modeSelect.appendChild(o);
    });
    // try keep by value key
    const map = { Presencial: "Presencial", Virtual: "Virtual", "Híbrida": "Híbrida", Indistinto: "Indistinto",
      "In person": "Presencial", Online: "Virtual", Hybrid: "Híbrida", Either: "Indistinto" };
    const key = map[prev] || prev;
    if ([...modeSelect.options].some((o) => o.value === key)) modeSelect.value = key;
  }

  const levelSelect = form?.querySelector('[name="level"]');
  if (levelSelect) {
    const prev = levelSelect.value;
    const levels = [
      ["", I18N[lang].opt_optional],
      ["Inicial", I18N[lang].opt_inicial],
      ["Intermedio", I18N[lang].opt_intermedio],
      ["Avanzado", I18N[lang].opt_avanzado],
    ];
    levelSelect.innerHTML = "";
    levels.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      levelSelect.appendChild(o);
    });
    const map = { Inicial: "Inicial", Intermedio: "Intermedio", Avanzado: "Avanzado",
      Beginner: "Inicial", Intermediate: "Intermedio", Advanced: "Avanzado" };
    const key = map[prev] || prev;
    if ([...levelSelect.options].some((o) => o.value === key)) levelSelect.value = key;
  }

  // Lang buttons state
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  // Theme toggle labels if present
  if (toggle) {
    const dark = body.classList.contains("theme-dark");
    const label = dark ? I18N[lang].theme_to_light : I18N[lang].theme_to_dark;
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    const text = toggle.querySelector(".color-toggle-text");
    if (text) text.textContent = dark ? I18N[lang].theme_dark : I18N[lang].theme_light;
  }

  try {
    localStorage.setItem("delefoco-lang", lang);
  } catch (_) {}
}

// Wire lang buttons
document.querySelectorAll(".lang-btn[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyLanguage(btn.getAttribute("data-lang"));
  });
});

// Init language from storage or browser
(function initLang() {
  applyLanguage("es");
})();

// Patch form status messages to use current language
