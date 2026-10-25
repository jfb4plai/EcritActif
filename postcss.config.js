import { fileURLToPath } from 'url';

// Chemin absolu : sans lui Tailwind ne trouve pas sa config quand le projet est lancé depuis un autre dossier.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};
