// Registro de páginas: App.jsx arma la navegación desde acá. Para agregar una página no
// se toca ningún archivo compartido: basta crear `src/pages/MiPagina.jsx` con su
// componente como export default y su metadata como propiedad del componente:
//
//   function MarketBook() { ... }
//   MarketBook.meta = { id: 'market', label: 'Mercado', order: 25 }
//   export default MarketBook
//
// `order` define la posición en la barra (menor va primero). Un .jsx de esta carpeta sin
// `meta` es un componente auxiliar y no aparece en la navegación. La metadata va en el
// componente y no como `export const` para no romper el fast refresh de Vite.

const modules = import.meta.glob('./*.jsx', { eager: true })

export const PAGES = Object.values(modules)
  .map((module) => module.default)
  .filter((Component) => Component?.meta)
  .map((Component) => ({ ...Component.meta, Component }))
  .sort((a, b) => a.order - b.order)
