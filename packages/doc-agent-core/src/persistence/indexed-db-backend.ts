import type {
  BackendProtocolV2,
  EditResult,
  FileData,
  FileDownloadResponse,
  FileInfo,
  FileUploadResponse,
  GlobResult,
  GrepResult,
  LsResult,
  ReadRawResult,
  ReadResult,
  WriteResult,
} from "deepagents/browser";
import {
  createFileData,
  fileDataToString,
  getMimeType,
  globSearchFiles,
  grepMatchesFromFiles,
  isFileDataBinary,
  isFileDataV1,
  isTextMimeType,
  migrateToFileDataV2,
  performStringReplacement,
  updateFileData,
} from "../../../../libs/deepagents/src/backends/utils.js";
import { getDocAgentDb } from "./idb.js";

export class IndexedDBBackend implements BackendProtocolV2 {
  private readonly fileFormat: "v1" | "v2" = "v2";
  private filesCache: Record<string, FileData> | null = null;

  private async loadFiles(): Promise<Record<string, FileData>> {
    if (this.filesCache) {
      return this.filesCache;
    }
    const db = await getDocAgentDb();
    const keys = await db.getAllKeys("files");
    const entries = await Promise.all(
      keys.map(async (key) => [key, await db.get("files", key)] as const),
    );
    this.filesCache = Object.fromEntries(
      entries.filter((entry): entry is [string, FileData] => entry[1] != null),
    );
    return this.filesCache;
  }

  private async saveFile(path: string, fileData: FileData): Promise<void> {
    const db = await getDocAgentDb();
    await db.put("files", fileData, path);
    if (this.filesCache) {
      this.filesCache[path] = fileData;
    }
  }

  async ls(path: string): Promise<LsResult> {
    const files = await this.loadFiles();
    const infos: FileInfo[] = [];
    const subdirs = new Set<string>();
    const normalizedPath = path.endsWith("/") ? path : `${path}/`;

    for (const [filePath, fileData] of Object.entries(files)) {
      if (!filePath.startsWith(normalizedPath)) {
        continue;
      }

      const relative = filePath.slice(normalizedPath.length);
      if (relative.includes("/")) {
        subdirs.add(`${normalizedPath}${relative.split("/")[0]}/`);
        continue;
      }

      const size = isFileDataV1(fileData)
        ? fileData.content.join("\n").length
        : isFileDataBinary(fileData)
          ? fileData.content.byteLength
          : fileData.content.length;
      infos.push({
        path: filePath,
        is_dir: false,
        size,
        modified_at: fileData.modified_at,
      });
    }

    for (const subdir of [...subdirs].sort()) {
      infos.push({ path: subdir, is_dir: true, size: 0, modified_at: "" });
    }

    infos.sort((a, b) => a.path.localeCompare(b.path));
    return { files: infos };
  }

  async read(filePath: string, offset = 0, limit = 500): Promise<ReadResult> {
    const files = await this.loadFiles();
    const fileData = files[filePath];
    if (!fileData) {
      return { error: `File '${filePath}' not found` };
    }

    const fileDataV2 = migrateToFileDataV2(fileData, filePath);
    if (!isTextMimeType(fileDataV2.mimeType)) {
      return { content: fileDataV2.content, mimeType: fileDataV2.mimeType };
    }

    if (typeof fileDataV2.content !== "string") {
      return { error: `File '${filePath}' has binary content but text MIME type` };
    }

    const lines = fileDataV2.content.split("\n");
    return {
      content: lines.slice(offset, offset + limit).join("\n"),
      mimeType: fileDataV2.mimeType,
    };
  }

  async readRaw(filePath: string): Promise<ReadRawResult> {
    const files = await this.loadFiles();
    const fileData = files[filePath];
    if (!fileData) {
      return { error: `File '${filePath}' not found` };
    }
    return { data: fileData };
  }

  async write(filePath: string, content: string): Promise<WriteResult> {
    const files = await this.loadFiles();
    if (filePath in files) {
      return {
        error: `Cannot write to ${filePath} because it already exists. Read and then make an edit, or write to a new path.`,
      };
    }

    const mimeType = getMimeType(filePath);
    const newFileData = createFileData(content, undefined, this.fileFormat, mimeType);
    await this.saveFile(filePath, newFileData);
    return { path: filePath };
  }

  async edit(
    filePath: string,
    oldString: string,
    newString: string,
    replaceAll = false,
  ): Promise<EditResult> {
    const files = await this.loadFiles();
    const fileData = files[filePath];
    if (!fileData) {
      return { error: `Error: File '${filePath}' not found` };
    }

    const content = fileDataToString(fileData);
    const result = performStringReplacement(content, oldString, newString, replaceAll);
    if (typeof result === "string") {
      return { error: result };
    }

    const [newContent, occurrences] = result;
    const newFileData = updateFileData(fileData, newContent);
    await this.saveFile(filePath, newFileData);
    return { path: filePath, occurrences };
  }

  async grep(
    pattern: string,
    path = "/",
    glob: string | null = null,
  ): Promise<GrepResult> {
    const files = await this.loadFiles();
    return { matches: grepMatchesFromFiles(files, pattern, path, glob) };
  }

  async glob(pattern: string, path = "/"): Promise<GlobResult> {
    const files = await this.loadFiles();
    const result = globSearchFiles(files, pattern, path);
    if (result === "No files found") {
      return { files: [] };
    }

    const paths = result.split("\n");
    const infos: FileInfo[] = paths.map((filePath) => {
      const fileData = files[filePath];
      const size = fileData
        ? isFileDataV1(fileData)
          ? fileData.content.join("\n").length
          : isFileDataBinary(fileData)
            ? fileData.content.byteLength
            : fileData.content.length
        : 0;
      return {
        path: filePath,
        is_dir: false,
        size,
        modified_at: fileData?.modified_at ?? "",
      };
    });
    return { files: infos };
  }

  async uploadFiles(filesToUpload: Array<[string, Uint8Array]>): Promise<FileUploadResponse[]> {
    const responses: FileUploadResponse[] = [];

    for (const [path, content] of filesToUpload) {
      try {
        const mimeType = getMimeType(path);
        const fileData =
          this.fileFormat === "v2" && !isTextMimeType(mimeType)
            ? createFileData(content, undefined, "v2", mimeType)
            : createFileData(
                new TextDecoder().decode(content),
                undefined,
                this.fileFormat,
                mimeType,
              );
        await this.saveFile(path, fileData);
        responses.push({ path, error: null });
      } catch {
        responses.push({ path, error: "invalid_path" });
      }
    }

    return responses;
  }

  async downloadFiles(paths: string[]): Promise<FileDownloadResponse[]> {
    const files = await this.loadFiles();
    return paths.map((path) => {
      const fileData = files[path];
      if (!fileData) {
        return { path, content: null, error: "file_not_found" as const };
      }

      const fileDataV2 = migrateToFileDataV2(fileData, path);
      if (typeof fileDataV2.content === "string") {
        return {
          path,
          content: new TextEncoder().encode(fileDataV2.content),
          error: null,
        };
      }
      return { path, content: fileDataV2.content, error: null };
    });
  }

  async listAllFiles(): Promise<Record<string, FileData>> {
    return this.loadFiles();
  }

  async replaceAllFiles(files: Record<string, FileData>): Promise<void> {
    const db = await getDocAgentDb();
    const existingKeys = await db.getAllKeys("files");
    await Promise.all(existingKeys.map((key) => db.delete("files", key)));
    await Promise.all(Object.entries(files).map(([path, data]) => db.put("files", data, path)));
    this.filesCache = { ...files };
  }

  invalidateCache(): void {
    this.filesCache = null;
  }

  async upsertFile(filePath: string, content: string): Promise<WriteResult> {
    const mimeType = getMimeType(filePath);
    const newFileData = createFileData(content, undefined, this.fileFormat, mimeType);
    await this.saveFile(filePath, newFileData);
    return { path: filePath };
  }

  async deleteFile(filePath: string): Promise<{ ok: boolean; error?: string }> {
    const files = await this.loadFiles();
    if (!files[filePath]) {
      return { ok: false, error: "file_not_found" };
    }

    const db = await getDocAgentDb();
    await db.delete("files", filePath);
    if (this.filesCache) {
      delete this.filesCache[filePath];
    }
    return { ok: true };
  }
}

let sharedBackend: IndexedDBBackend | null = null;

export function getDocAgentBackend(): IndexedDBBackend {
  if (!sharedBackend) {
    sharedBackend = new IndexedDBBackend();
  }
  return sharedBackend;
}
