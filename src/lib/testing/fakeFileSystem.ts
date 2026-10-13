// Faux expo-file-system en mémoire pour les tests (Jest n'a pas le module
// natif). Usage : jest.mock("expo-file-system", () => jest.requireActual("@/lib/testing/fakeFileSystem")).
// Ne couvre que ce dont l'app se sert : File, Directory, Paths.document.

const files = new Map<string, Uint8Array>();
const directories = new Set<string>();

type Part = string | { uri: string };

function joinUri(parts: Part[]): string {
  const [first, ...names] = parts.map((part) => (typeof part === "string" ? part : part.uri));
  return names.reduce((uri, name) => `${uri.replace(/\/?$/, "/")}${name}`, first);
}

export class File {
  readonly uri: string;

  constructor(...parts: Part[]) {
    this.uri = joinUri(parts);
  }

  get name() {
    return this.uri.slice(this.uri.lastIndexOf("/") + 1);
  }

  get exists() {
    return files.has(this.uri);
  }

  get size() {
    return files.get(this.uri)?.length ?? null;
  }

  private content(): Uint8Array {
    const content = files.get(this.uri);
    if (!content) throw new Error(`Fichier absent : ${this.uri}`);
    return content;
  }

  write(content: string | Uint8Array, options?: { encoding?: string }) {
    files.set(
      this.uri,
      typeof content === "string"
        ? new Uint8Array(Buffer.from(content, options?.encoding === "base64" ? "base64" : "utf8"))
        : content
    );
  }

  async base64() {
    return Buffer.from(this.content()).toString("base64");
  }

  async bytes() {
    return new Uint8Array(this.content());
  }

  async copy(destination: File) {
    files.set(destination.uri, this.content());
  }

  delete() {
    if (!files.delete(this.uri)) throw new Error(`Fichier absent : ${this.uri}`);
  }
}

export class Directory {
  readonly uri: string;

  constructor(...parts: Part[]) {
    this.uri = joinUri(parts).replace(/\/?$/, "/");
  }

  get exists() {
    return directories.has(this.uri);
  }

  create() {
    directories.add(this.uri);
  }

  list(): File[] {
    return [...files.keys()]
      .filter((uri) => uri.startsWith(this.uri) && !uri.slice(this.uri.length).includes("/"))
      .map((uri) => new File(uri));
  }
}

export const Paths = { document: new Directory("file:///data/app/files/") };

export const fakeFiles = files;

export function resetFakeFileSystem() {
  files.clear();
  directories.clear();
}
