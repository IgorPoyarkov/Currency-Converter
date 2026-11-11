// Путь к файлу из public/ с учётом vite.base.
// В dev BASE_URL = "/", в собранном виде = "/Currency-Converter/".
export default function asset(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
