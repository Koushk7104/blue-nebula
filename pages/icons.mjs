// Line icons (24px grid, currentColor). Used at build time instead of glyph characters.
const P={
  memory:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  canvas:'<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3"/>',
  code:'<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  checks:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  template:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
  local:'<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
  export:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  roadmap:'<path d="M4 12h14M13 6l6 6-6 6"/>',
  play:'<path d="M8 5l11 7-11 7z"/>',
  list:'<path d="M5 7h14M5 12h14M5 17h9"/>',
  flow:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3 3 0 013 3v6.5"/>',
  brief:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  hardware:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  chart:'<path d="M4 17l5-5 3 3 8-8M15 7h5v5"/>'
};
export const icon=(n)=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
